import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../services/api';
import { fromDateTimeLocal, getErrorMessage } from '../utils/format';
import OfferCard from '../components/OfferCard';
import PageHeading from '../components/PageHeading';
import Pagination from '../components/Pagination';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import TextField from '../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';

function OffersPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    area: '',
    category: '',
    pickup_from: '',
    pickup_to: '',
  });
  const [applied, setApplied] = useState({});
  const [page, setPage] = useState(1);
  const [offers, setOffers] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    Object.entries(applied).forEach(([key, value]) => {
      if (value) {
        params.set(
          key,
          key.startsWith('pickup_') ? fromDateTimeLocal(value) : value,
        );
      }
    });

    api
      .get(`/offers?${params}`, { signal: controller.signal })
      .then((result) => {
        setError('');
        setOffers(result.offers);
        setHasNext(result.offers.length === result.limit);
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError')
          setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [applied, page]);

  function update(event) {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function applyFilters(event) {
    event.preventDefault();
    const next = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value.trim()),
    );
    setLoading(true);
    setError('');
    setPage(1);
    setApplied(next);
  }

  function clearFilters() {
    setLoading(true);
    setError('');
    setFilters({ area: '', category: '', pickup_from: '', pickup_to: '' });
    setApplied({});
    setPage(1);
  }

  return (
    <main className="page-shell app-main" id="main-content">
      <PageHeading
        actions={
          user.role === 'donor' && (
            <Button to="/my-offers/new" variant="outline">
              Share an offer
            </Button>
          )
        }
        description="A few good things, shared by people nearby."
        eyebrow="The neighborhood table"
        title="Find something good."
      />
      <form className="filter-panel" onSubmit={applyFilters}>
        <div className="filter-panel__heading">
          <h2>Find your next pickup</h2>
          <span>Choose an area, food type, or time that works for you.</span>
        </div>
        <div className="filter-grid">
          <TextField
            id="filter-area"
            label="Area"
            name="area"
            placeholder="Any neighborhood"
            value={filters.area}
            onChange={update}
          />
          <TextField
            id="filter-category"
            label="Food type"
            name="category"
            placeholder="Any category"
            value={filters.category}
            onChange={update}
          />
          <TextField
            id="filter-pickup-from"
            label="Pickup from"
            name="pickup_from"
            type="datetime-local"
            value={filters.pickup_from}
            onChange={update}
          />
          <TextField
            id="filter-pickup-to"
            label="Pickup by"
            name="pickup_to"
            type="datetime-local"
            value={filters.pickup_to}
            onChange={update}
          />
        </div>
        <div className="filter-panel__actions">
          <Button type="submit">Show offers</Button>
          <Button onClick={clearFilters} type="button" variant="quiet">
            Clear filters
          </Button>
        </div>
      </form>

      <section className="results-section" aria-labelledby="results-title">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Freshly shared</p>
            <h2 id="results-title">Available offers</h2>
          </div>
          {!loading && (
            <span className="results-count">
              {offers.length === 0
                ? 'No offers on this page'
                : `${offers.length} ${offers.length === 1 ? 'offer' : 'offers'}`}
            </span>
          )}
        </div>
        {error && (
          <Alert className="page-alert" variant="error">
            {error}
          </Alert>
        )}
        {loading ? (
          <LoadingIndicator label="Finding offers…" />
        ) : offers.length ? (
          <div className="offer-grid">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          !error && (
            <EmptyState
              action={
                Object.keys(applied).length > 0 ? (
                  <Button onClick={clearFilters} variant="outline">
                    Clear filters
                  </Button>
                ) : user.role === 'donor' ? (
                  <Button to="/my-offers/new">Share the first offer</Button>
                ) : (
                  <Link className="text-link" to="/my-reservations">
                    See your reservations
                  </Link>
                )
              }
              title="Nothing on the table just yet"
            >
              {Object.keys(applied).length > 0
                ? 'Try another area, category, or pickup time.'
                : 'Check back soon for something good nearby.'}
            </EmptyState>
          )
        )}
        {!loading && !error && (
          <Pagination
            page={page}
            onChange={(nextPage) => {
              setLoading(true);
              setPage(nextPage);
            }}
            hasNext={hasNext}
          />
        )}
      </section>
    </main>
  );
}

export default OffersPage;
