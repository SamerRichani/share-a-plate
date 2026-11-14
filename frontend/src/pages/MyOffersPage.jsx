import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/format';
import OfferCard from '../components/OfferCard';
import PageHeading from '../components/PageHeading';
import Pagination from '../components/Pagination';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingIndicator from '../components/ui/LoadingIndicator';

function MyOffersPage() {
  const location = useLocation();
  const [offers, setOffers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.message || '');

  const loadOffers = useCallback(
    async (signal) => {
      try {
        const result = await api.get(`/offers/mine?page=${page}&limit=12`, {
          signal,
        });
        setError('');
        setOffers(result.offers);
        setHasNext(result.offers.length === result.limit);
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
    Promise.resolve().then(() => loadOffers(controller.signal));
    return () => controller.abort();
  }, [loadOffers]);

  async function changeStatus(offer, action) {
    const prompt =
      action === 'remove'
        ? `Remove “${offer.title}”? Pending reservations will be cancelled and portions restored.`
        : `Close “${offer.title}”? Existing reservations will still be honored.`;
    if (!window.confirm(prompt)) return;
    setError('');
    setNotice('');
    try {
      if (action === 'remove') {
        await api.delete(`/offers/${offer.id}`);
        setNotice('Offer removed. Its reservation history is preserved.');
      } else {
        await api.patch(`/offers/${offer.id}`, { status: 'closed' });
        setNotice('Offer closed. Existing reservations remain active.');
      }
      setLoading(true);
      await loadOffers();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <main className="page-shell app-main" id="main-content">
      <PageHeading
        actions={<Button to="/my-offers/new">Create an offer</Button>}
        description="Keep an eye on what you’ve shared and what still needs a pickup."
        eyebrow="Your food, out in the world"
        title="My offers"
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
        <LoadingIndicator label="Loading your offers…" />
      ) : offers.length ? (
        <>
          <div className="offer-grid">
            {offers.map((offer) => (
              <OfferCard
                actions={
                  <>
                    <Link
                      className="text-link"
                      to={`/offers/${offer.id}/reservations`}
                    >
                      Reservations
                    </Link>
                    {offer.status !== 'removed' && (
                      <>
                        {new Date(offer.pickup_deadline) > new Date() && (
                          <Link
                            className="text-link"
                            to={`/my-offers/${offer.id}/edit`}
                          >
                            Edit
                          </Link>
                        )}
                        {offer.status === 'active' &&
                          new Date(offer.pickup_deadline) > new Date() && (
                            <Button
                              onClick={() => changeStatus(offer, 'close')}
                              variant="quiet"
                            >
                              Close
                            </Button>
                          )}
                        <Button
                          onClick={() => changeStatus(offer, 'remove')}
                          variant="quiet"
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </>
                }
                className="offer-card--managed"
                key={offer.id}
                offer={offer}
                showStatus
              />
            ))}
          </div>
          <Pagination
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
            action={
              <Button to="/my-offers/new">Create your first offer</Button>
            }
            title="Nothing shared yet"
          >
            When you post a food offer, it’ll show up here with its pickup and
            reservation details.
          </EmptyState>
        )
      )}
    </main>
  );
}

export default MyOffersPage;
