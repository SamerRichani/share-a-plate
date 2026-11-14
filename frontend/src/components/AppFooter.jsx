import { Link } from 'react-router';

function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__inner">
        <Link className="brand brand--footer" to="/">
          <span className="brand__mark" aria-hidden="true">
            <span />
          </span>
          <span className="brand__name">share a plate</span>
        </Link>
        <p>Good food, shared. A little more good in every neighborhood.</p>
        <span className="site-footer__copyright">
          ShareAPlate <span aria-hidden="true">·</span> Made for community
        </span>
      </div>
    </footer>
  );
}

export default AppFooter;
