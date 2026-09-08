export function money(n: number, currency = "INR", locale = "en-IN") {
  const s = Math.abs(n).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sym = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency + " ";
  return (n < 0 ? "-" : n > 0 ? "+" : "") + sym + s;
}
export function plain(n: number, currency = "INR", locale = "en-IN") {
  const sym = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency + " ";
  return sym + Math.abs(n).toLocaleString(locale, { maximumFractionDigits: 0 });
}
/** IST-anchored 'today' so late-night entries land on the right day. */
export function todayIST() {
  return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
}
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}
export function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
}
export function monthLabel(month: string) {
  return new Date(month + "-01T00:00:00Z").toLocaleString("en-IN", {
    month: "long", year: "numeric", timeZone: "UTC",
  });
}
