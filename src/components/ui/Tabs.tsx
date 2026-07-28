interface Props {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab ${active === tab ? 'active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
