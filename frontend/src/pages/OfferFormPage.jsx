import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/format';
import OfferForm from '../components/OfferForm';
import PageHeading from '../components/PageHeading';
import Alert from '../components/ui/Alert';
import LoadingIndicator from '../components/ui/LoadingIndicator';

function OfferFormPage({ editing = false }) {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editing) return undefined;
    const controller = new AbortController();
    api
      .get(`/offers/${offerId}`, { signal: controller.signal })
      .then(({ offer: result }) => {
        if (result.status === 'removed') {
          setError('Removed offers cannot be edited.');
        } else {
          setOffer(result);
        }
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError')
          setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [editing, offerId]);

  async function save(values) {
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/offers/${offerId}`, values);
      } else {
        await api.post('/offers', values);
      }
      navigate('/my-offers', {
        replace: true,
        state: {
          message: editing
            ? 'Your offer was updated.'
            : 'Your offer is now live.',
        },
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell app-main app-main--narrow" id="main-content">
      <Link className="back-link" to="/my-offers">
        <span aria-hidden="true">←</span> My offers
      </Link>
      <PageHeading
        description={
          editing
            ? 'Changes are checked against active reservations and pickup commitments.'
            : 'A few clear details help neighbors find and collect what you share.'
        }
        eyebrow={editing ? 'Update your listing' : 'Pass something good along'}
        title={editing ? 'Edit offer' : 'Share food'}
      />
      {error && (
        <Alert className="page-alert" variant="error">
          {error}
        </Alert>
      )}
      {loading ? (
        <LoadingIndicator label="Loading offer…" />
      ) : (
        !error && (
          <OfferForm
            initialOffer={offer}
            onSubmit={save}
            submitting={submitting}
          />
        )
      )}
    </main>
  );
}

export default OfferFormPage;
