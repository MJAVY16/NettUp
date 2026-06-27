/**
 * Maps a "severity" fraction (0 = good, 1 = bad) to a color along a smooth
 * green → yellow → red scale. Used for debt progress bars: credit-card
 * utilization is redder as usage rises; payoff progress is greener as the
 * remaining balance/payments shrink.
 */
export function severityColor(fraction: number): string {
  const f = Math.min(1, Math.max(0, fraction));
  const hue = 120 * (1 - f); // 120 = green, 60 = yellow, 0 = red
  return `hsl(${hue}, 75%, 45%)`;
}
