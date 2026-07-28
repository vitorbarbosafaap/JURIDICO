import { CATEGORICAL_PALETTE, type CategoricalDatum } from './CategoricalBarChart';

// Part-to-whole donut for low-cardinality breakdowns (e.g. contingência).
// Legend is always rendered alongside — identity never relies on color alone.
export function DonutChart({ data, size = 132 }: { data: CategoricalDatum[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2;
  const stroke = size * 0.26;
  const r = radius - stroke / 2;
  const circumference = 2 * Math.PI * r;

  if (total === 0) {
    return <p className="text-muted text-sm">Sem dados suficientes ainda.</p>;
  }

  let offset = 0;

  return (
    <div className="row" style={{ gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${radius} ${radius})`}>
          {data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * circumference;
            const el = (
              <circle
                key={d.label}
                cx={radius}
                cy={radius}
                r={r}
                fill="none"
                stroke={CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              >
                <title>
                  {d.label}: {d.value}
                </title>
              </circle>
            );
            offset += dash;
            return el;
          })}
        </g>
        <text
          x={radius}
          y={radius}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.16}
          fontWeight={800}
          fill="var(--pitzi-ink)"
        >
          {total}
        </text>
      </svg>
      <div className="chart-legend" style={{ marginTop: 0, flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div className="item" key={d.label}>
            <span
              className="swatch"
              style={{ background: CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length] }}
            />
            <span style={{ color: 'var(--pitzi-ink)', fontWeight: 600 }}>{d.label}</span>
            <span className="text-muted">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
