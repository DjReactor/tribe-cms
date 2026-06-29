/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: create_analytics_views
 *
 * PocketBase "view" collections backed by SQL SELECT … GROUP BY (§7), queried
 * through the normal API (no dual-write). At per-instance data volumes these are
 * instant; the documented scale path is a denormalized fact table behind the
 * same field shape.
 *
 * Conventions (verified against the installed PocketBase):
 *   - every SELECT must expose a unique `id` column — ROW_NUMBER() OVER () for
 *     multi-row rollups, a constant (1) for single-row summaries;
 *   - numeric aggregates are CAST(... AS INT|REAL) so PB infers `number` rather
 *     than defaulting to `json`;
 *   - relation fields are plain id columns, so joins are `ON x.id = d.relation`;
 *   - PB date fields are ISO-ish TEXT, so strftime/julianday parse them directly.
 *
 * Views are dropped + recreated (they hold no data) for idempotency.
 */
migrate((app) => {
  const mk = (name, viewQuery) => {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) { /* not present */ }
    app.save(new Collection({
      type: "view",
      name,
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      viewQuery,
    }));
  };

  // Pipeline funnel: deal count + won revenue per stage.
  mk("analytics_deals_funnel",
    "SELECT (ROW_NUMBER() OVER ()) AS id, stage, " +
    "CAST(COUNT(*) AS INT) AS count, " +
    "CAST(COALESCE(SUM(won_value),0) AS REAL) AS revenue " +
    "FROM deals GROUP BY stage");

  // Headline scalars (single row): totals, win rate, avg job value, time-to-close.
  mk("analytics_summary",
    "SELECT 1 AS id, " +
    "CAST(COUNT(*) AS INT) AS total_deals, " +
    "CAST(SUM(CASE WHEN stage='won' THEN 1 ELSE 0 END) AS INT) AS won_deals, " +
    "CAST(SUM(CASE WHEN stage='lost' THEN 1 ELSE 0 END) AS INT) AS lost_deals, " +
    "CAST(COALESCE(SUM(CASE WHEN stage='won' THEN won_value ELSE 0 END),0) AS REAL) AS won_revenue, " +
    "CAST(COALESCE(ROUND(AVG(CASE WHEN stage='won' THEN won_value END),2),0) AS REAL) AS avg_job_value, " +
    "CAST(COALESCE(ROUND(100.0*SUM(CASE WHEN stage='won' THEN 1 ELSE 0 END)/NULLIF(SUM(CASE WHEN stage IN ('won','lost') THEN 1 ELSE 0 END),0),1),0) AS REAL) AS win_rate_pct, " +
    "CAST(COALESCE(ROUND(AVG(CASE WHEN stage='won' AND closed_at!='' THEN julianday(closed_at)-julianday(created) END),1),0) AS REAL) AS avg_days_to_close " +
    "FROM deals");

  // Revenue by acquisition source (join lead_sources for the label).
  mk("analytics_revenue_by_source",
    "SELECT (ROW_NUMBER() OVER ()) AS id, COALESCE(ls.label,'Unknown') AS source, " +
    "CAST(COUNT(*) AS INT) AS deals, " +
    "CAST(COALESCE(SUM(CASE WHEN d.stage='won' THEN d.won_value ELSE 0 END),0) AS REAL) AS revenue " +
    "FROM deals d LEFT JOIN lead_sources ls ON ls.id = d.source GROUP BY d.source");

  // Top referrers: which customers drive referral revenue.
  mk("analytics_top_referrers",
    "SELECT (ROW_NUMBER() OVER ()) AS id, COALESCE(c.name,'Unknown') AS referrer, " +
    "CAST(COUNT(*) AS INT) AS referred_deals, " +
    "CAST(COALESCE(SUM(CASE WHEN d.stage='won' THEN d.won_value ELSE 0 END),0) AS REAL) AS referred_revenue " +
    "FROM deals d JOIN contacts c ON c.id = d.referred_by WHERE d.referred_by != '' GROUP BY d.referred_by");

  // Cost-per-job + ROAS by CLOSE month (deals won that month) — quick pulse.
  mk("analytics_cost_per_source_close",
    "SELECT (ROW_NUMBER() OVER ()) AS id, COALESCE(ls.label,'Unknown') AS source, sp.period, " +
    "CAST(sp.amount AS REAL) AS spend, " +
    "CAST(COUNT(CASE WHEN d.stage='won' THEN 1 END) AS INT) AS jobs_won, " +
    "CAST(COALESCE(SUM(CASE WHEN d.stage='won' THEN d.won_value ELSE 0 END),0) AS REAL) AS revenue, " +
    "CAST(ROUND(sp.amount/NULLIF(COUNT(CASE WHEN d.stage='won' THEN 1 END),0),2) AS REAL) AS cost_per_job, " +
    "CAST(ROUND(COALESCE(SUM(CASE WHEN d.stage='won' THEN d.won_value ELSE 0 END),0)/NULLIF(sp.amount,0),2) AS REAL) AS roas " +
    "FROM source_spend sp JOIN lead_sources ls ON ls.id = sp.source " +
    "LEFT JOIN deals d ON d.source = sp.source AND strftime('%Y-%m', d.closed_at) = sp.period " +
    "GROUP BY sp.source, sp.period");

  // Cost-per-job + ROAS by LEAD-CREATED month (true ROI of a month's spend; lagging).
  mk("analytics_cost_per_source_cohort",
    "SELECT (ROW_NUMBER() OVER ()) AS id, COALESCE(ls.label,'Unknown') AS source, sp.period, " +
    "CAST(sp.amount AS REAL) AS spend, " +
    "CAST(COUNT(CASE WHEN d.stage='won' THEN 1 END) AS INT) AS jobs_won, " +
    "CAST(COALESCE(SUM(CASE WHEN d.stage='won' THEN d.won_value ELSE 0 END),0) AS REAL) AS revenue, " +
    "CAST(ROUND(sp.amount/NULLIF(COUNT(CASE WHEN d.stage='won' THEN 1 END),0),2) AS REAL) AS cost_per_job, " +
    "CAST(ROUND(COALESCE(SUM(CASE WHEN d.stage='won' THEN d.won_value ELSE 0 END),0)/NULLIF(sp.amount,0),2) AS REAL) AS roas " +
    "FROM source_spend sp JOIN lead_sources ls ON ls.id = sp.source " +
    "LEFT JOIN deals d ON d.source = sp.source AND strftime('%Y-%m', d.created) = sp.period " +
    "GROUP BY sp.source, sp.period");

  // Call outcomes by sentiment (+ successful count).
  mk("analytics_call_outcomes",
    "SELECT (ROW_NUMBER() OVER ()) AS id, COALESCE(NULLIF(sentiment,''),'unknown') AS sentiment, " +
    "CAST(COUNT(*) AS INT) AS calls, " +
    "CAST(SUM(CASE WHEN call_successful THEN 1 ELSE 0 END) AS INT) AS successful " +
    "FROM ai_call_logs GROUP BY COALESCE(NULLIF(sentiment,''),'unknown')");

  // Speed-to-lead: avg days from a contact's creation to its first activity.
  mk("analytics_speed_to_lead",
    "SELECT 1 AS id, " +
    "CAST(COALESCE(ROUND(AVG(d),2),0) AS REAL) AS avg_days_to_first_touch, " +
    "CAST(COUNT(*) AS INT) AS contacts_measured FROM (" +
    "SELECT (julianday(MIN(a.created))-julianday(c.created)) AS d " +
    "FROM contacts c JOIN activities a ON a.contact = c.id " +
    "WHERE c.created != '' AND a.created != '' GROUP BY c.id)");
}, (app) => {
  for (const n of [
    "analytics_deals_funnel", "analytics_summary", "analytics_revenue_by_source",
    "analytics_top_referrers", "analytics_cost_per_source_close",
    "analytics_cost_per_source_cohort", "analytics_call_outcomes", "analytics_speed_to_lead",
  ]) {
    try { app.delete(app.findCollectionByNameOrId(n)); } catch (_) { /* already gone */ }
  }
});
