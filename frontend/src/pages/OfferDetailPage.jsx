import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { formatDateTime, getErrorMessage } from '../utils/format';
import PageHeading from '../components/PageHeading';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import TextField from '../components/ui/TextField';
import StatusBadge from '../components/ui/StatusBadge';

function OfferDetailPage({ offerId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reservation, setReservation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/offers/${offerId}`, { signal: controller.signal })
      .then((result) => {
        setError('');
        setOffer(result.offer);
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError')
          setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [offerId]);

  const isOwner = user.role === 'donor' && offer?.donor_id === user.id;
  const canReserve =
    user.role === 'recipient' &&
    offer?.status === 'active' &&
    offer.remaining_quantity > 0 &&
    new Date(offer.pickup_deadline) > new Date();

  async function reserve(event) {
    event.preventDefault();
    setSubmitting(true);
    setActionError('');
    setMessage('');
    try {
      const result = await api.post(`/offers/${offerId}/reservations`, {
        quantity: Number(quantity),
      });
      setReservation(result.reservation);
      setMessage(result.message);
      const updated = await api.get(`/offers/${offerId}`);
      setOffer(updated.offer);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function reportOffer(event) {
    event.preventDefault();
    setSubmitting(true);
    setActionError('');
    setMessage('');
    try {
      await api.post(`/offers/${offerId}/reports`, { reason });
      setReason('');
      setReporting(false);
      setMessage(
        'Thanks for letting us know. Your report was sent for review.',
      );
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-shell app-main" id="main-content">
        <LoadingIndicator label="Loading offer…" />
      </main>
    );
  }

  if (error || !offer) {
    return (
      <main className="page-shell app-main" id="main-content">
        <EmptyState
          action={
            <Button onClick={() => navigate('/offers')} variant="outline">
              Back to offers
            </Button>
          }
          title="We couldn’t find that offer"
        >
          {error ||
            'This offer may have been removed or is no longer available to you.'}
        </EmptyState>
      </main>
    );
  }

  return (
    <main className="page-shell app-main" id="main-content">
      <Link className="back-link" to="/offers">
        <span aria-hidden="true">←</span> All offers
      </Link>
      {message && (
        <Alert className="page-alert" variant="success">
          {message}
          {reservation?.pickup_code && (
            <span className="inline-code">
              Pickup code: <strong>{reservation.pickup_code}</strong>
            </span>
          )}
        </Alert>
      )}
      {actionError && (
        <Alert className="page-alert" variant="error">
          {actionError}
        </Alert>
      )}
      <section className="offer-detail">
        <div className="offer-detail__main">
          <div className="offer-detail__title-row">
            <span className="offer-card__category">{offer.category}</span>
            <StatusBadge status={offer.status} />
          </div>
          <h1>{offer.title}</h1>
          <p className="offer-detail__description">
            {offer.description || 'Shared with care by a local food partner.'}
          </p>
          <dl className="offer-facts">
            <div>
              <dt>Area</dt>
              <dd>{offer.area}</dd>
            </div>
            <div>
              <dt>Pickup location</dt>
              <dd>{offer.location}</dd>
            </div>
            <div>
              <dt>Pickup window</dt>
              <dd>
                {formatDateTime(offer.pickup_start)}
                <span> to </span>
                {formatDateTime(offer.pickup_deadline)}
              </dd>
            </div>
            <div>
              <dt>Portions left</dt>
              <dd>{offer.remaining_quantity}</dd>
            </div>
          </dl>
          {isOwner && (
            <div className="form-actions">
              {offer.status !== 'removed' &&
                new Date(offer.pickup_deadline) > new Date() && (
                  <Button to={`/my-offers/${offer.id}/edit`} variant="outline">
                    Edit offer
                  </Button>
                )}
              <Button to={`/offers/${offer.id}/reservations`} variant="outline">
                View reservations
              </Button>
            </div>
          )}
        </div>

        <aside className="offer-detail__aside">
          {canReserve && !reservation && (
            <form className="form-card stack-form" onSubmit={reserve}>
              <p className="eyebrow">Make it yours</p>
              <h2>Reserve portions</h2>
              <p className="form-card__intro">
                Collection is between {formatDateTime(offer.pickup_start)} and{' '}
                {formatDateTime(offer.pickup_deadline)}.
              </p>
              <TextField
                id="reservation-quantity"
                label="How many portions?"
                max={offer.remaining_quantity}
                min="1"
                name="quantity"
                required
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <Button disabled={submitting} type="submit">
                {submitting ? 'Reserving…' : 'Reserve food'}
              </Button>
              <p className="form-card__fine-print">
                You can cancel before the pickup deadline.
              </p>
            </form>
          )}
          {user.role === 'recipient' && !canReserve && !reservation && (
            <div className="unavailable-card">
              <h2>Not available to reserve</h2>
              <p>
                This offer is closed, sold out, or past its pickup deadline.
              </p>
            </div>
          )}
          {reservation && (
            <div className="form-card reservation-confirmation">
              <p className="eyebrow">You’re all set</p>
              <h2>Reservation confirmed</h2>
              <p>
                We’ve saved {reservation.quantity}{' '}
                {reservation.quantity === 1 ? 'portion' : 'portions'} for you.
                Show this code to the donor at pickup.
              </p>
              <div className="pickup-code">
                <span>Pickup code</span>
                <strong>{reservation.pickup_code}</strong>
              </div>
              <Button to="/my-reservations" variant="outline">
                My reservations
              </Button>
            </div>
          )}
          {user.role !== 'administrator' && (
            <div className="report-box">
              {reporting ? (
                <form className="stack-form" onSubmit={reportOffer}>
                  <label className="field__label" htmlFor="report-reason">
                    What should we know?
                  </label>
                  <textarea
                    className="field__input field__textarea"
                    id="report-reason"
                    maxLength="2000"
                    minLength="1"
                    required
                    rows="4"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <div className="form-actions">
                    <Button
                      disabled={submitting}
                      type="submit"
                      variant="outline"
                    >
                      Send report
                    </Button>
                    <Button
                      onClick={() => setReporting(false)}
                      type="button"
                      variant="quiet"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  className="text-button"
                  onClick={() => setReporting(true)}
                  type="button"
                >
                  Report this offer
                </button>
              )}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function OfferDetailRoute() {
  const { offerId } = useParams();
  return <OfferDetailPage key={offerId} offerId={offerId} />;
}

export default OfferDetailRoute;
