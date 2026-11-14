import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { formatDateTime, getErrorMessage } from '../utils/format';
import PageHeading from '../components/PageHeading';
import Pagination from '../components/Pagination';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import StatusBadge from '../components/ui/StatusBadge';

const reportStatuses = ['open', 'resolved', 'dismissed'];
const offerStatuses = ['active', 'closed', 'removed'];

function AdminPage() {
  const [tab, setTab] = useState('reports');
  const [reportStatus, setReportStatus] = useState('open');
  const [offerStatus, setOfferStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [reports, setReports] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const reportsTabRef = useRef(null);
  const offersTabRef = useRef(null);

  const loadRecords = useCallback(
    async (signal) => {
      const isReports = tab === 'reports';
      const status = isReports ? reportStatus : offerStatus;
      try {
        const result = await api.get(
          `/admin/${isReports ? 'reports' : 'offers'}?status=${status}&page=${page}&limit=12`,
          { signal },
        );
        setError('');
        const items = isReports ? result.reports : result.offers;
        if (isReports) setReports(items);
        else setOffers(items);
        setHasNext(items.length === result.limit);
      } catch (requestError) {
        if (requestError.name !== 'AbortError')
          setError(getErrorMessage(requestError));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [offerStatus, page, reportStatus, tab],
  );

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => loadRecords(controller.signal));
    return () => controller.abort();
  }, [loadRecords]);

  async function updateReport(report, status) {
    if (
      !window.confirm(
        `${status === 'resolved' ? 'Resolve' : 'Dismiss'} this report?`,
      )
    ) {
      return;
    }
    setError('');
    setNotice('');
    try {
      await api.patch(`/admin/reports/${report.id}`, { status });
      setNotice(`Report #${report.id} marked ${status}.`);
      setLoading(true);
      await loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function moderateOffer(offer, status) {
    const prompt =
      status === 'removed'
        ? `Remove “${offer.title}”? Pending reservations will be cancelled and portions restored.`
        : `Close “${offer.title}”? Existing reservations will still be honored.`;
    if (!window.confirm(prompt)) return;
    setError('');
    setNotice('');
    try {
      await api.patch(`/admin/offers/${offer.id}`, { status });
      setNotice(`Offer “${offer.title}” is now ${status}.`);
      setLoading(true);
      await loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  const statuses = tab === 'reports' ? reportStatuses : offerStatuses;
  const currentStatus = tab === 'reports' ? reportStatus : offerStatus;
  const records = tab === 'reports' ? reports : offers;

  function switchTab(nextTab) {
    setLoading(true);
    setPage(1);
    setTab(nextTab);
  }

  function handleTabKeyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextTab =
      event.key === 'Home'
        ? 'reports'
        : event.key === 'End'
          ? 'offers'
          : tab === 'reports'
            ? 'offers'
            : 'reports';
    switchTab(nextTab);
    (nextTab === 'reports' ? reportsTabRef : offersTabRef).current?.focus();
  }

  return (
    <main className="page-shell app-main" id="main-content">
      <PageHeading
        description="Review community reports and take action on offers when needed."
        eyebrow="Keep the table welcoming"
        title="Community moderation"
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
      <div
        className="moderation-tabs"
        role="tablist"
        aria-label="Moderation area"
      >
        <button
          aria-controls="moderation-panel"
          aria-selected={tab === 'reports'}
          className={`moderation-tab${tab === 'reports' ? ' is-active' : ''}`}
          id="reports-tab"
          onClick={() => switchTab('reports')}
          onKeyDown={handleTabKeyDown}
          ref={reportsTabRef}
          role="tab"
          tabIndex={tab === 'reports' ? 0 : -1}
          type="button"
        >
          Reports
        </button>
        <button
          aria-controls="moderation-panel"
          aria-selected={tab === 'offers'}
          className={`moderation-tab${tab === 'offers' ? ' is-active' : ''}`}
          id="offers-tab"
          onClick={() => switchTab('offers')}
          onKeyDown={handleTabKeyDown}
          ref={offersTabRef}
          role="tab"
          tabIndex={tab === 'offers' ? 0 : -1}
          type="button"
        >
          Offers
        </button>
      </div>
      <section
        aria-labelledby={`${tab}-tab`}
        className="moderation-panel"
        id="moderation-panel"
        role="tabpanel"
        tabIndex="0"
      >
        <div className="moderation-toolbar">
          <div>
            <p className="eyebrow">Review queue</p>
            <h2>{tab === 'reports' ? 'Offer reports' : 'Shared offers'}</h2>
          </div>
          <label className="field moderation-status-filter">
            <span className="field__label">Status</span>
            <select
              className="field__input"
              onChange={(event) => {
                setLoading(true);
                setPage(1);
                if (tab === 'reports') setReportStatus(event.target.value);
                else setOfferStatus(event.target.value);
              }}
              value={currentStatus}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status[0].toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading ? (
          <LoadingIndicator label={`Loading ${tab}…`} />
        ) : records.length ? (
          <div className="moderation-list">
            {tab === 'reports'
              ? reports.map((report) => (
                  <article className="moderation-card" key={report.id}>
                    <div className="moderation-card__heading">
                      <div>
                        <p className="eyebrow">
                          Report #{report.id} <span>·</span> Offer #
                          {report.offer_id}
                        </p>
                        <h3>Reported by account #{report.reporter_id}</h3>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                    <p className="moderation-card__reason">{report.reason}</p>
                    <p className="moderation-card__date">
                      Submitted {formatDateTime(report.created_at)}
                    </p>
                    <div className="form-actions">
                      <Button
                        to={`/offers/${report.offer_id}`}
                        variant="outline"
                      >
                        Inspect offer
                      </Button>
                      {report.status === 'open' && (
                        <>
                          <Button
                            onClick={() => updateReport(report, 'resolved')}
                            variant="secondary"
                          >
                            Resolve
                          </Button>
                          <Button
                            onClick={() => updateReport(report, 'dismissed')}
                            variant="quiet"
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                    </div>
                  </article>
                ))
              : offers.map((offer) => (
                  <article className="moderation-card" key={offer.id}>
                    <div className="moderation-card__heading">
                      <div>
                        <p className="eyebrow">
                          Offer #{offer.id} <span>·</span> {offer.area}
                        </p>
                        <h3>{offer.title}</h3>
                      </div>
                      <StatusBadge status={offer.status} />
                    </div>
                    <p className="moderation-card__reason">
                      {offer.description || 'No description provided.'}
                    </p>
                    <p className="moderation-card__date">
                      Pickup by {formatDateTime(offer.pickup_deadline)} ·{' '}
                      {offer.remaining_quantity} portions left
                    </p>
                    <div className="form-actions">
                      <Button to={`/offers/${offer.id}`} variant="outline">
                        Inspect offer
                      </Button>
                      {offer.status === 'active' && (
                        <Button
                          onClick={() => moderateOffer(offer, 'closed')}
                          variant="secondary"
                        >
                          Close offer
                        </Button>
                      )}
                      {offer.status !== 'removed' && (
                        <Button
                          onClick={() => moderateOffer(offer, 'removed')}
                          variant="quiet"
                        >
                          Remove offer
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
          </div>
        ) : (
          <EmptyState
            title={
              tab === 'reports'
                ? `No ${currentStatus} reports`
                : `No ${currentStatus} offers`
            }
          >
            There’s nothing in this part of the review queue right now.
          </EmptyState>
        )}
        {!loading && records.length > 0 && (
          <Pagination
            label={tab}
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

export default AdminPage;
