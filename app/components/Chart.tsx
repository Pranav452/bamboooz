/** Smooth cubic spline through the points, drawn as a line plus a soft area fill. */
function spline(pts: number[], w: number, h: number, pad: number) {
  const n = pts.length;
  if (n < 2) return { path: "", area: "", endX: 0, endY: h / 2 };
  const max = Math.max(...pts, 1) * 1.15;
  const P = pts.map((v, i) => [ (i * w) / (n - 1), pad + (h - pad * 2) - (v / max) * (h - pad * 2) ] as const);
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[i - 1] ?? P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const end = P[n - 1];
  return { path: d, area: `${d} L${w},${h} L0,${h} Z`, endX: end[0], endY: end[1] };
}

export default function Chart({
  points, labels, color = "#E8611A", height = 150,
}: { points: number[]; labels: string[]; color?: string; height?: number }) {
  const W = 320;
  const { path, area, endX, endY } = spline(points, W, height, 12);
  const id = "g" + color.replace("#", "");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="Spending trend">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" className="trend" />
        <circle cx={endX} cy={endY} r="4.5" fill={color} />
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[11px] text-[var(--muted)]">
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </div>
  );
}
