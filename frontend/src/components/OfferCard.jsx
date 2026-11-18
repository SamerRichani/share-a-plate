import { Link } from 'react-router';
import { formatDateTime } from '../utils/format';
import StatusBadge from './ui/StatusBadge';

// A small picture for each kind of food. Anything else gets a plate.
const CATEGORY_ICONS = {
  bakery: '🥖',
  produce: '🥕',
  'prepared meals': '🍲',
  groceries: '🛒',
  dairy: '🧀',
  fruit: '🍎',
  drinks: '🥤',
  desserts: '🍰',
};

// Works out what to show in the status badge.
function getDisplayStatus(offer) {
  if (offer.status !== 'active') return offer.status;
  if (new Date(offer.pickup_deadline) <= new Date()) return 'expired';
  if (offer.remaining_quantity === 0) return 'sold out';
  return 'active';
}

// One food offer shown as a card in a list.
function OfferCard({ actions, className = '', offer, showStatus = false }) {
  const icon = CATEGORY_ICONS[offer.category] || '🍽️';
  // How full the "portions left" bar is, from 0% to 100%.
  const percentLeft = offer.quantity
    ? Math.round((offer.remaining_quantity / offer.quantity) * 100)
    : 100;

  return (
    <article className={`offer-card ${className}`.trim()}>
      <div className="offer-card__topline">
        <span className="offer-card__category">
          <span className="offer-card__icon" aria-hidden="true">
            {icon}
          </span>
          {offer.category}
        </span>
        {showStatus && <StatusBadge status={getDisplayStatus(offer)} />}
      </div>
      <h2>
        <Link to={`/offers/${offer.id}`}>{offer.title}</Link>
      </h2>
      <p className="offer-card__description">
        {offer.description || 'A little something to share with the community.'}
      </p>
      <div className="offer-card__portions">
        <span>
          <strong>{offer.remaining_quantity}</strong>
          {offer.quantity ? ` of ${offer.quantity}` : ''} portions left
        </span>
        <span className="portion-meter" aria-hidden="true">
          <span style={{ width: `${percentLeft}%` }} />
        </span>
      </div>
      <dl className="offer-card__details">
        <div>
          <dt>Area</dt>
          <dd>{offer.area}</dd>
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
