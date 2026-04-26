export default function Badge({ children, variant = 'default', dot = false, size = 'sm' }) {
  const colors = {
    default: { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)' },
    success: { bg: 'var(--success-light)', text: 'var(--success-dark)' },
    warning: { bg: 'var(--warning-light)', text: 'var(--warning-dark)' },
    danger: { bg: 'var(--danger-light)', text: 'var(--danger-dark)' },
    info: { bg: 'var(--info-light)', text: 'var(--info-dark)' },
    accent: { bg: 'var(--accent-lighter)', text: 'var(--accent-dark)' },
    delivery: { bg: 'var(--info-light)', text: 'var(--info-dark)' },
    pickup: { bg: 'var(--warning-light)', text: 'var(--warning-dark)' },
    local: { bg: 'var(--success-light)', text: 'var(--success-dark)' },
  };

  const c = colors[variant] || colors.default;
  const sizeStyles = size === 'xs' 
    ? { fontSize: '0.6875rem', padding: '2px 6px' }
    : size === 'md'
    ? { fontSize: '0.8125rem', padding: '4px 12px' }
    : { fontSize: '0.75rem', padding: '3px 8px' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: c.bg,
      color: c.text,
      borderRadius: 'var(--radius-full)',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      lineHeight: 1.3,
      ...sizeStyles,
    }}>
      {dot && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: c.text,
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}
