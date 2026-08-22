import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Pair, Service, ServiceArea } from '@/types/index';
import { buildServiceTree, flattenServiceTree } from '@/lib/service-tree';
import { buildAreaTree, flattenAreaTree } from '@/lib/area-tree';

/**
 * Services × areas, showing which combinations have a landing page.
 *
 * READ-ONLY BY DESIGN. There is deliberately no create affordance in the empty
 * cells: a grid of blanks each offering a button is an invitation to fill the
 * grid, and filling the grid is precisely the doorway shape this whole feature
 * exists to avoid. Creation goes through the deliberate two-picker flow, one
 * page at a time. Cells that already have a page link to it.
 */
export function CoverageMatrix(
  { pairs, services, areas }: { pairs: Pair[]; services: Service[]; areas: ServiceArea[] },
) {
  const serviceRows = flattenServiceTree(buildServiceTree(services));
  const areaColumns = flattenAreaTree(buildAreaTree(areas));

  const byKey = new Map(pairs.map((p) => [`${p.service}:${p.service_area}`, p]));

  if (serviceRows.length === 0 || areaColumns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add at least one service and one service area to see coverage.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-xs">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium text-muted-foreground border-b border-r border-border/60 min-w-52">
              Service \ Area
            </th>
            {areaColumns.map((area) => (
              <th
                key={area.id}
                className="bg-muted/50 px-3 py-3 text-left font-medium text-muted-foreground border-b border-border/60 whitespace-nowrap"
              >
                <span style={{ paddingLeft: `${(area.depth - 1) * 10}px` }}>{area.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {serviceRows.map((service) => (
            <tr key={service.id} className="hover:bg-muted/50">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left font-medium text-foreground border-r border-border/60 whitespace-nowrap"
              >
                <span style={{ paddingLeft: `${(service.depth - 1) * 10}px` }}>{service.name}</span>
              </th>
              {areaColumns.map((area) => {
                const pair = byKey.get(`${service.id}:${area.id}`);
                return (
                  <td key={area.id} className="px-3 py-2.5 text-center border-t border-border">
                    {pair ? (
                      <Link
                        href={`/dashboard/landing-pages/${pair.id}`}
                        title={`${service.name} in ${area.name} — ${pair.is_published ? 'published' : 'draft'}`}
                        className={cn(
                          'inline-block h-2.5 w-2.5 rounded-full transition-transform hover:scale-150',
                          pair.is_published ? 'bg-success' : 'bg-muted-foreground/30',
                        )}
                      />
                    ) : (
                      <span className="text-border select-none">·</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
