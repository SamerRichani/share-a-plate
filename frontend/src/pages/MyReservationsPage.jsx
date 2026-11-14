import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../services/api';
import { formatDateTime, getErrorMessage } from '../utils/format';
import PageHeading from '../components/PageHeading';
import Pagination from '../components/Pagination';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import StatusBadge from '../components/ui/StatusBadge';

function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadReservations = useCallback(
    async (signal) => {
      try {
        const result = await api.get(
          `/reservations/mine?page=${page}&limit=12`,
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
    [page],
  );

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => loadReservations(controller.signal));
    return () => controller.abort();
  }, [loadReservations]);

  async function cancelReservation(reservation) {
    if (
      !window.confirm(
        `Cancel your reservation for “${reservation.title}”? The portions will become available again.`,
      )
    ) {
      return;
    }
    setError('');
    setNotice('');
    try {
      await api.post(`/reservations/${reservation.id}/cancel`);
      setNotice('Reservation cancelled. The portions are available again.');
      setLoading(true);
      await loadReservations();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <main className="page-shell app-main" id="main-content">
      <PageHeading
        description="Pickup details and reservation codes, all in one place."
        eyebrow="Your saved portions"
        title="My reservations"
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
        <LoadingIndicator label="Loading your reservations…" />
      ) : reservations.length ? (
        <>
          <div className="reservation-list">
            {reservations.map((reservation) => (
              <article className="reservation-card" key={reservation.id}>
                <div className="reservation-card__heading">
                  <div>
                    <p className="eyebrow">Reserved portions</p>
                    <h2>{reservation.title}</h2>
                  </div>
                  <StatusBadge status={reservation.status} />
                </div>
                <dl className="reservation-details">
                  <div>
                    <dt>Quantity</dt>
                    <dd>{reservation.quantity}</dd>
                  </div>
                  <div>
                    <dt>Pickup location</dt>
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
                {reservation.status === 'reserved' && (
                  <div className="reservation-card__footer">
                    <div className="pickup-code pickup-code--compact">
                      <span>Show this code at pickup</span>
                      <strong>{reservation.pickup_code}</strong>
                    </div>
                    <Button
                      onClick={() => cancelReservation(reservation)}
                      variant="outline"
                    >
                      Cancel reservation
                    </Button>
                  </div>
                )}
                {reservation.status !== 'reserved' && (
                  <p className="reservation-card__final">
                    {reservation.status === 'collected'
                      ? 'This pickup has been confirmed. Thanks for being part of it.'
                      : reservation.status === 'cancelled'
                        ? 'This reservation was cancelled.'
                        : 'The pickup window passed before this reservation was collected.'}
                  </p>
                )}
                <Link
                  className="text-link"
                  to={`/offers/${reservation.offer_id}`}
                >
                  Offer details <span aria-hidden="true">→</span>
                </Link>
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
          <EmptyState
            action={<Button to="/offers">Find food nearby</Button>}
            title="No reservations yet"
          >
            When you find something good, reserve portions and your pickup code
            will be waiting here.
          </EmptyState>
        )
      )}
    </main>
  );
}

export default MyReservationsPage;
