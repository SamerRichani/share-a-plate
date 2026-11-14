import { useId } from 'react';

function EmptyState({ action, children, title }) {
  const titleId = useId();

  return (
    <section className="empty-state" aria-labelledby={titleId}>
      <span className="empty-state__icon" aria-hidden="true">
        ✳
      </span>
      <h2 id={titleId}>{title}</h2>
      <p>{children}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </section>
  );
}

export default EmptyState;
