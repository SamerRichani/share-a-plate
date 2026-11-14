function LoadingIndicator({ label = 'Loading', className = '' }) {
  return (
    <div
      className={`loading-indicator ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="loading-indicator__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingIndicator;
