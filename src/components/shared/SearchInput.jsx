import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '320px',
    }}>
      <Search size={16} style={{
        position: 'absolute',
        left: '12px',
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
          padding: '10px 14px 10px 38px',
          fontSize: 'var(--font-base)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          transition: 'all var(--transition-fast)',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)';
          e.target.style.boxShadow = '0 0 0 3px var(--accent-lighter)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}
