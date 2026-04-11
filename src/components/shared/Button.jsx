export default function Button({ children, variant = 'primary', size = 'md', icon, onClick, disabled, fullWidth, type = 'button', ...props }) {
  const variants = {
    primary: {
      background: 'var(--accent-gradient)',
      color: 'var(--text-inverse)',
      border: 'none',
      boxShadow: 'var(--shadow-accent)',
    },
    secondary: {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: 'none',
      boxShadow: 'none',
    },
    danger: {
      background: 'var(--danger)',
      color: 'var(--text-inverse)',
      border: 'none',
      boxShadow: '0 4px 14px rgba(225, 112, 85, 0.3)',
    },
    success: {
      background: 'var(--success)',
      color: 'var(--text-inverse)',
      border: 'none',
      boxShadow: '0 4px 14px rgba(0, 184, 148, 0.3)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--accent)',
      border: '1.5px solid var(--accent)',
      boxShadow: 'none',
    },
  };

  const sizes = {
    xs: { padding: '6px 10px', fontSize: 'var(--font-xs)', gap: '4px' },
    sm: { padding: '8px 14px', fontSize: 'var(--font-sm)', gap: '6px' },
    md: { padding: '10px 20px', fontSize: 'var(--font-base)', gap: '8px' },
    lg: { padding: '14px 28px', fontSize: 'var(--font-md)', gap: '8px' },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        borderRadius: 'var(--radius-md)',
        transition: 'all 200ms ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
        lineHeight: 1.4,
        ...v,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.filter = 'brightness(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = '';
        e.target.style.filter = '';
      }}
      {...props}
    >
      {icon && icon}
      {children}
    </button>
  );
}
