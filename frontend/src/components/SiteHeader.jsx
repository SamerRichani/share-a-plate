import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';

function SiteHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header" id="top">
      <div className="page-shell site-header__inner">
        <Link className="brand" to="/" aria-label="ShareAPlate home">
          <span className="brand__mark" aria-hidden="true">
            <span />
          </span>
          <span className="brand__name">share a plate</span>
        </Link>
        <nav className="primary-nav" aria-label="Main navigation">
          {user ? (
            <>
              <Link to="/offers">Find food</Link>
              {user.role === 'donor' && <Link to="/my-offers">My offers</Link>}
              {user.role === 'recipient' && (
                <Link to="/my-reservations">My reservations</Link>
              )}
              {user.role === 'administrator' && (
                <Link to="/admin">Moderation</Link>
              )}
            </>
          ) : (
            <>
              <Link to="/#how-it-works">How it works</Link>
              <Link to="/#food-partners">Food partners</Link>
              <Link to="/#neighbors">Neighbors</Link>
            </>
          )}
        </nav>
        {user ? (
          <div className="site-header__account">
            <span className="site-header__greeting">
              Hi, {user.name.split(' ')[0]}
            </span>
            <Button
              className="site-header__cta"
              onClick={logout}
              variant="outline"
            >
              Sign out
            </Button>
          </div>
        ) : (
          <div className="site-header__account">
            <Link className="site-header__login" to="/login">
              Sign in
            </Link>
            <Button
              className="site-header__cta"
              to="/register"
              variant="outline"
            >
              Join us <span aria-hidden="true">↗</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

export default SiteHeader;
