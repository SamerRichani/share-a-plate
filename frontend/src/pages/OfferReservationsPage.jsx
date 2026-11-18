import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../services/api';
import { formatDateTime, getErrorMessage } from '../utils/format';
import PageHeading from '../components/PageHeading';
import Pagination from '../components/Pagination';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import StatusBadge from '../components/ui/StatusBadge';

function OfferReservationsPage() {
  const { offerId } = useParams();
  const [reservations, setReservations] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [codes, setCodes] = useState({});
  const [busyId, setBusyId] = useState(null);

  const loadReservations = useCallback(
    async (signal) => {
      try {
        const result = await api.get(
          `/offers/${offerId}/reservations?page=${page}&limit=12`,
          { signal },
        );
        setError('');
        setReservations(result.reservations);
        setHasNext(result.reservations.length === result.limit);
      } catch (requestError) {
        if (requestError.name !== 'AbortError')
          setError(getErrorMessage(requestError));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [offerId, page],
  );

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => loadReservations(controller.signal));
    return () => controller.abort();
  }, [loadReservations]);

  async function confirmPickup(event, reservation) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusyId(reservation.id);
    try {
      await api.post(`/reservations/${reservation.id}/pickup`, {
        pickup_code: codes[reservation.id] || '',
      });
      setNotice(`Pickup confirmed for ${reservation.title}.`);
      setCodes((current) => ({ ...current, [reservation.id]: '' }));
      setLoading(true);
      await loadReservations();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page-shell app-main" id="main-content">
      <Link className="back-link" to="/my-offers">
        <span aria-hidden="true">←</span> My offers
      </Link>
      <PageHeading
        description="Check the reservation status and confirm collection with the code the recipient shares."
        eyebrow="Handover time"
        title="Offer reservations"
      />
      {notice && (
        <Alert className="page-alert" variant="success">
          {notice}
        </Alert>
      )}
      {error && (
        <Alert className="page-alert" variant="error">
          {error}
        </Alert>
      )}
      {loading ? (
        <LoadingIndicator label="Loading reservations…" />
      ) : reservations.length ? (
        <>
          <div className="reservation-list">
            {reservations.map((reservation) => (
              <article className="reservation-card" key={reservation.id}>
                <div className="reservation-card__heading">
                  <div>
                    <p className="eyebrow">{reservation.quantity} portions</p>
                    <h2>{reservation.title}</h2>
                  </div>
                  <StatusBadge status={reservation.status} />
                </div>
                <dl className="reservation-details">
                  <div>
                    <dt>Collection</dt>
                    <dd>{reservation.location}</dd>
                  </div>
                  <div>
                    <dt>Pickup window</dt>
                    <dd>
                      {formatDateTime(reservation.pickup_start)} –{' '}
                      {formatDateTime(reservation.pickup_deadline)}
                    </dd>
                  </div>
                </dl>
                {reservation.status === 'reserved' ? (
                  <form
                    className="pickup-confirm-form"
                    onSubmit={(event) => confirmPickup(event, reservation)}
                  >
                    <label
                      className="field__label"
                      htmlFor={`pickup-code-${reservation.id}`}
                    >
                      Recipient’s pickup code
                    </label>
                    <input
                      autoComplete="off"
                      className="field__input pickup-code-input"
                      id={`pickup-code-${reservation.id}`}
                      maxLength="32"
                      minLength="6"
                      placeholder="e.g. K7P2XM"
                      required
                      value={codes[reservation.id] || ''}
                      onChange={(event) =>
                        setCodes((current) => ({
                          ...current,
                          [reservation.id]: event.target.value.toUpperCase(),
                        }))
                      }
                    />
                    <Button
                      disabled={busyId === reservation.id}
                      type="submit"
                      variant="secondary"
                    >
                      {busyId === reservation.id
                        ? 'Confirming…'
                        : 'Confirm pickup'}
                    </Button>
                  </form>
                ) : (
                  <p className="reservation-card__final">
                    {reservation.status === 'collected'
                      ? 'Collection confirmed.'
                      : reservation.status === 'cancelled'
                        ? 'This reservation was cancelled.'
                        : 'This reservation expired after its pickup deadline.'}
                  </p>
                )}
              </article>
            ))}
          </div>
          <Pagination
            label="reservations"
            page={page}
            onChange={(nextPage) => {
              setLoading(true);
              setPage(nextPage);
            }}
            hasNext={hasNext}
          />
        </>
      ) : (
        !error && (
          <EmptyState title="No one has reserved this offer yet">
            When a neighbor reserves portions, their reservation will appear
            here.
          </EmptyState>
        )
      )}
    </main>
  );
}

export default OfferReservationsPage;
