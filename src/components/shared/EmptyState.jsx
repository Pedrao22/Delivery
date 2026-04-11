export default function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-12) var(--space-8)',
      textAlign: 'center',
      animation: 'fadeIn 400ms ease',
    }}>
      {icon && (
        <div style={{
          fontSize: '3rem',
          marginBottom: 'var(--space-4)',
          opacity: 0.5,
        }}>
          {icon}
        </div>
      )}
      <h3 style={{
        fontSize: 'var(--font-md)',
        fontWeight: 'var(--fw-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-2)',
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          fontSize: 'var(--font-sm)',
          color: 'var(--text-tertiary)',
          maxWidth: '280px',
        }}>
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          {action}
        </div>
      )}
    </div>
  );
}
