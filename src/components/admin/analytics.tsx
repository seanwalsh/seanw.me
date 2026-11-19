import type { Stats } from "@/lib/types";
import { Breakdown } from "./breakdown";
import { ClicksChart } from "./clicks-chart";

/** Chart plus the Bitly-style breakdown grid. */
export function Analytics({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-4">
      <section className="card p-5">
        <h3 className="mb-4 text-sm font-semibold">Clicks over time</h3>
        <ClicksChart data={stats.series} />
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Breakdown title="Referrers" data={stats.referrers} />
        <Breakdown title="Countries" data={stats.countries} kind="country" />
        <Breakdown title="Cities" data={stats.cities} />
        <Breakdown title="Devices" data={stats.devices} />
        <Breakdown title="Browsers" data={stats.browsers} />
        <Breakdown title="Operating systems" data={stats.os} />
      </div>
    </div>
  );
}
