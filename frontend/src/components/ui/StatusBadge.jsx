import { formatStatus } from '../../utils/format';

function StatusBadge({ status }) {
  const tone = ['active', 'reserved', 'open'].includes(status)
    ? 'positive'
    : ['removed', 'cancelled', 'expired', 'dismissed'].includes(status)
      ? 'negative'
      : ['closed', 'collected', 'resolved'].includes(status)
        ? 'neutral'
        : 'neutral';

  return (
    <span className={`status-badge status-badge--${tone}`}>
      {formatStatus(status)}
    </span>
  );
}

export default StatusBadge;
