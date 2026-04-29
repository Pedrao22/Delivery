import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Search size={16} style={{
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-tertiary)',
        pointerEvents: 'none',
      }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '11px 16px 11px 42px',
          fontSize: '0.9rem',
          border: '1.5px solid var(--border-light)',
          borderRadius: '99px',
          outline: 'none',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)';
          e.target.style.background = 'var(--surface)';
          e.target.style.boxShadow = '0 0 0 3px var(--accent-lighter)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-light)';
          e.target.style.background = 'var(--bg-secondary)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}
