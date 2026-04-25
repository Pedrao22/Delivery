import './Button.css';

export default function Button({ children, variant = 'primary', size = 'md', icon, onClick, disabled, fullWidth, type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth ? 'btn-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {icon && icon}
      {children}
    </button>
  );
}
