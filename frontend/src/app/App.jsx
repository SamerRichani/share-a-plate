import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import AdminPage from '../pages/AdminPage';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import MyOffersPage from '../pages/MyOffersPage';
import MyReservationsPage from '../pages/MyReservationsPage';
import OfferDetailPage from '../pages/OfferDetailPage';
import OfferFormPage from '../pages/OfferFormPage';
import OfferReservationsPage from '../pages/OfferReservationsPage';
import OffersPage from '../pages/OffersPage';
import RegisterPage from '../pages/RegisterPage';
import AppFooter from '../components/AppFooter';
import SiteHeader from '../components/SiteHeader';
import Alert from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';

// The list of pages (client-side routing with React Router).
//
// These two "guards" only improve the user experience: they hide pages you
// can't use. The real security check happens on the server, which verifies
// the login token and role on EVERY request.

// Pages inside <RequireAuth> need you to be signed in; otherwise → /login.
function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }
  return <Outlet />;
}

// Pages wrapped in <RoleRoute role="donor"> are only for that role.
function RoleRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate replace to="/login" />;
  if (user.role !== role) return <Navigate replace to="/offers" />;
  return children;
}

function App() {
  const { notice, clearNotice } = useAuth();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      {notice && (
        <div className="page-shell app-notice">
          <Alert variant="warning">
            {notice}{' '}
            <button className="text-button" onClick={clearNotice} type="button">
              Dismiss
            </button>
          </Alert>
        </div>
      )}
      <Routes>
        <Route element={<LandingPage />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<RequireAuth />}>
          <Route element={<OffersPage />} path="/offers" />
          <Route element={<OfferDetailPage />} path="/offers/:offerId" />
          <Route
            element={
              <RoleRoute role="donor">
                <MyOffersPage />
              </RoleRoute>
            }
            path="/my-offers"
          />
          <Route
            element={
              <RoleRoute role="donor">
                <OfferFormPage />
              </RoleRoute>
            }
            path="/my-offers/new"
          />
          <Route
            element={
              <RoleRoute role="donor">
                <OfferFormPage editing />
              </RoleRoute>
            }
            path="/my-offers/:offerId/edit"
          />
          <Route
            element={
              <RoleRoute role="donor">
                <OfferReservationsPage />
              </RoleRoute>
            }
            path="/offers/:offerId/reservations"
          />
          <Route
            element={
              <RoleRoute role="recipient">
                <MyReservationsPage />
              </RoleRoute>
            }
            path="/my-reservations"
          />
          <Route
            element={
              <RoleRoute role="administrator">
                <AdminPage />
              </RoleRoute>
            }
            path="/admin"
          />
          <Route element={<Navigate replace to="/offers" />} path="*" />
        </Route>
      </Routes>
      <AppFooter />
    </>
  );
}

export default App;
