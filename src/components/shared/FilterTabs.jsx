export default function FilterTabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      padding: '3px',
      overflow: 'auto',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            padding: '7px 14px',
            fontSize: 'var(--font-sm)',
            fontWeight: active === tab.value ? 600 : 500,
            borderRadius: 'var(--radius-sm)',
            background: active === tab.value ? 'var(--surface)' : 'transparent',
            color: active === tab.value ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: active === tab.value ? 'var(--shadow-sm)' : 'none',
            transition: 'all var(--transition-fast)',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {tab.icon && <span style={{ marginRight: '6px' }}>{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span style={{
              marginLeft: '6px',
              fontSize: '0.6875rem',
              background: active === tab.value ? 'var(--accent-lighter)' : 'var(--bg-secondary)',
              color: active === tab.value ? 'var(--accent)' : 'var(--text-tertiary)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
