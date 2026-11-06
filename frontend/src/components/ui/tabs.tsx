export type TabItem = { id: string; label: string; disabled?: boolean };
export function Tabs({ tabs, activeTab, onChange, label = 'Sections' }: { tabs: TabItem[]; activeTab: string; onChange: (id: string) => void; label?: string }) {
  return <div className="tabs" role="tablist" aria-label={label}>
    {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} disabled={tab.disabled} onClick={() => onChange(tab.id)}>{tab.label}</button>)}
  </div>;
}
