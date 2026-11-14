import { Link } from 'react-router';
import { formatDateTime } from '../utils/format';
import StatusBadge from './ui/StatusBadge';

function OfferCard({ actions, className = '', offer, showStatus = false }) {
  const displayStatus =
    offer.status === 'active' && new Date(offer.pickup_deadline) <= new Date()
      ? 'expired'
      : offer.status === 'active' && offer.remaining_quantity === 0
        ? 'sold out'
        : offer.status;

  return (
    <article className={`offer-card ${className}`.trim()}>
      <div className="offer-card__topline">
        <span className="offer-card__category">{offer.category}</span>
        {showStatus && <StatusBadge status={displayStatus} />}
      </div>
      <h2>
        <Link to={`/offers/${offer.id}`}>{offer.title}</Link>
      </h2>
      <p className="offer-card__description">
        {offer.description || 'A little something to share with the community.'}
      </p>
      <dl className="offer-card__details">
        <div>
          <dt>Area</dt>
          <dd>{offer.area}</dd>
        </div>
        <div>
          <dt>Available</dt>
          <dd>{offer.remaining_quantity} portions</dd>
        </div>
        <div>
          <dt>Pickup by</dt>
          <dd>{formatDateTime(offer.pickup_deadline)}</dd>
        </div>
      </dl>
      <Link className="offer-card__link" to={`/offers/${offer.id}`}>
        See offer <span aria-hidden="true">→</span>
      </Link>
      {actions && <div className="offer-card__management">{actions}</div>}
    </article>
  );
}

export default OfferCard;
