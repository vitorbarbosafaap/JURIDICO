// Simple horizontal bar chart for categorical magnitude comparisons
// (casos por status, casos por seguradora/parceiro). No charting dependency —
// built as plain SVG/HTML per the dataviz method: fixed categorical hue order,
// labels/values in ink (never in the series color), legend always present.

export const CATEGORICAL_PALETTE = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#4a3aa7', // violet
  '#0a1128', // ink (overflow slot)
  '#00b28f', // pitzi accent (overflow slot)
];

export interface CategoricalDatum {
  label: string;
  value: number;
}

export function CategoricalBarChart({ data }: { data: CategoricalDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.every((d) => d.value === 0)) {
    return <p className="text-muted text-sm">Sem dados suficientes ainda.</p>;
  }

  return (
    <div className="stack" role="img" aria-label="Gráfico de barras categórico">
      {data.map((d, i) => {
        const color = CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length];
        const pct = Math.max(2, Math.round((d.value / max) * 100));
        return (
          <div key={d.label}>
            <div
              className="row"
              style={{ justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}
            >
              <span style={{ fontWeight: 600 }}>{d.label}</span>
              <span className="text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {d.value}
              </span>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 6, height: 10 }}>
              <div
                style={{
                  width: `${pct}%`,
                  background: color,
                  height: '100%',
                  borderRadius: 6,
                  transition: 'width .3s ease',
                }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
