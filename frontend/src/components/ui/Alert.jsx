function Alert({ children, className = '', variant = 'info', ...props }) {
  const isError = variant === 'error';

  return (
    <div
      className={`alert alert--${variant} ${className}`.trim()}
      {...props}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {children}
    </div>
  );
}

export default Alert;
