import { ContributionHeatmap } from "./ContributionHeatmap";

/**
 * Backward compatibility wrapper.
 * Solohub v0.2.0 replaces the plain bar chart with the Diwali ContributionHeatmap.
 */
export function WeeklyActivity() {
  return <ContributionHeatmap />;
}
