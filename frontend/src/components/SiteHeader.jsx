import Button from './ui/Button';

function SiteHeader() {
  return (
    <header className="site-header" id="top">
      <div className="page-shell site-header__inner">
        <a className="brand" href="#top" aria-label="ShareAPlate home">
          <span className="brand__mark" aria-hidden="true">
            <span />
          </span>
          <span className="brand__name">share a plate</span>
        </a>
        <nav className="primary-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#food-partners">Food partners</a>
          <a href="#neighbors">Neighbors</a>
        </nav>
        <Button className="site-header__cta" href="#about" variant="outline">
          About us <span aria-hidden="true">↗</span>
        </Button>
      </div>
    </header>
  );
}

export default SiteHeader;
