/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: create_legal_pages
 *
 * Creates the `legal_pages` collection that stores editable legal page content.
 * Fields:
 *   slug    — unique identifier, e.g. "privacy-policy" or "terms-of-service"
 *   title   — page title shown in the dashboard
 *   content — HTML/rich-text body rendered on the public page
 *
 * The `up` function also seeds the two built-in pages so the site shows
 * real content immediately after deployment.
 */
migrate(
  // ── up ───────────────────────────────────────────────────────────────────
  (app) => {
    const collection = new Collection({
      name: "legal_pages",
      type: "base",
      listRule:   "",   // public read
      viewRule:   "",
      createRule: null, // superadmin / admin only
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: "slug",
          type: "text",
          required: true,
          presentable: true,
        },
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "content",
          type: "editor",
          required: false,
          convertURLs: false,
        },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_legal_pages_slug ON legal_pages (slug)",
      ],
    });

    app.save(collection);

    // ── Seed default Privacy Policy ─────────────────────────────────────────
    const col = app.findCollectionByNameOrId("legal_pages");

    const privacy = new Record(col, {
      slug:    "privacy-policy",
      title:   "Privacy Policy",
      content: `<h2>1. Introduction</h2>
<p>Welcome to [Your Business Name]. We respect your privacy and are committed to protecting your personal data.</p>
<h2>2. Data Collection</h2>
<p>We may collect personal identification information such as your name, email address, phone number, etc. when you fill out forms on our site.</p>
<h2>3. How We Use Your Data</h2>
<p>We use your data to provide and improve our services, respond to inquiries, and communicate with you.</p>
<h2>4. Contact Us</h2>
<p>If you have any questions about this privacy policy, please contact us via our contact page.</p>`,
    });
    app.save(privacy);

    // ── Seed default Terms of Service ───────────────────────────────────────
    const terms = new Record(col, {
      slug:    "terms-of-service",
      title:   "Terms of Service",
      content: `<h2>1. Terms</h2>
<p>By accessing this website, you are agreeing to be bound by these website Terms and Conditions of Use.</p>
<h2>2. Use License</h2>
<p>Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.</p>
<h2>3. Disclaimer</h2>
<p>The materials on our website are provided "as is". We make no warranties, expressed or implied.</p>
<h2>4. Limitations</h2>
<p>In no event shall we or our suppliers be liable for any damages arising out of the use or inability to use the materials on our website.</p>`,
    });
    app.save(terms);
  },

  // ── down ─────────────────────────────────────────────────────────────────
  (app) => {
    const collection = app.findCollectionByNameOrId("legal_pages");
    app.delete(collection);
  }
);
