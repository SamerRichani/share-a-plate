import Button from '../components/ui/Button';
import SiteHeader from '../components/SiteHeader';

const steps = [
  {
    number: '01',
    title: 'Share what you have',
    description:
      'Food partners post good food that is ready for a new home, with clear pickup details.',
  },
  {
    number: '02',
    title: 'Find what you need',
    description:
      'Neighbors and community organizations discover available food nearby.',
  },
  {
    number: '03',
    title: 'Pick it up and enjoy',
    description:
      'A simple reservation helps good food reach the people who can use it.',
  },
];

const audiences = [
  {
    id: 'food-partners',
    eyebrow: 'For food partners',
    title: 'Make your extra count.',
    description:
      'Restaurants, bakeries, grocers, and local food businesses can help keep good food in the community.',
    icon: '↗',
    className: 'audience-card--green',
  },
  {
    id: 'neighbors',
    eyebrow: 'For neighbors',
    title: 'Find a little good nearby.',
    description:
      'Discover surplus food shared by your community and make it part of your next meal.',
    icon: '⌂',
    className: 'audience-card--peach',
  },
];

function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <section className="hero page-shell" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="eyebrow">
              <span className="eyebrow__dot" aria-hidden="true" />
              Good food. Good neighbors.
            </p>
            <h1 id="hero-title">
              A little good
              <br />
              goes <em>a long way.</em>
            </h1>
            <p className="hero__description">
              ShareAPlate brings surplus food and the people who can enjoy it
              closer together. Less waste, more community, one plate at a time.
            </p>
            <div className="hero__actions">
              <Button href="#how-it-works">See how it works</Button>
              <a className="text-link" href="#food-partners">
                I have food to share <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="hero__note">
              <span className="hero__note-icon" aria-hidden="true">
                ✳
              </span>
              <span>Small acts of sharing make a big difference.</span>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="hero-art__sun" />
            <div className="hero-art__spark hero-art__spark--one">✳</div>
            <div className="hero-art__spark hero-art__spark--two">✳</div>
            <div className="plate">
              <div className="plate__rim">
                <div className="plate__food plate__food--leaf-one" />
                <div className="plate__food plate__food--leaf-two" />
                <div className="plate__food plate__food--tomato" />
                <div className="plate__food plate__food--bread" />
                <div className="plate__food plate__food--grain" />
                <div className="plate__food plate__food--herb" />
              </div>
            </div>
            <div className="hero-art__label">
              <span className="hero-art__label-icon">✿</span>
              <span>
                <strong>Good things</strong>
                <small>are meant to be shared</small>
              </span>
            </div>
          </div>
        </section>

        <section
          className="steps-section"
          id="how-it-works"
          aria-labelledby="steps-title"
        >
          <div className="page-shell">
            <div className="section-heading">
              <p className="eyebrow">Good food, moving forward</p>
              <h2 id="steps-title">Sharing is simple.</h2>
              <p>
                A community-powered way to make sure good food finds a good
                home.
              </p>
            </div>
            <ol className="steps-grid">
              {steps.map((step) => (
                <li className="step-card" key={step.number}>
                  <span className="step-card__number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="audiences-section page-shell"
          aria-label="Who can join ShareAPlate"
        >
          {audiences.map((audience) => (
            <article
              className={`audience-card ${audience.className}`}
              id={audience.id}
              key={audience.id}
            >
              <span className="audience-card__icon" aria-hidden="true">
                {audience.icon}
              </span>
              <p className="eyebrow">{audience.eyebrow}</p>
              <h2>{audience.title}</h2>
              <p className="audience-card__description">
                {audience.description}
              </p>
            </article>
          ))}
        </section>
      </main>
      <footer className="site-footer" id="about">
        <div className="page-shell site-footer__inner">
          <a className="brand brand--footer" href="#top">
            <span className="brand__mark" aria-hidden="true">
              <span />
            </span>
            <span className="brand__name">share a plate</span>
          </a>
          <p>Good food, shared. A little more good in every neighborhood.</p>
          <span className="site-footer__copyright">
            ShareAPlate <span aria-hidden="true">·</span> Made for community
          </span>
        </div>
      </footer>
    </>
  );
}

export default App;
