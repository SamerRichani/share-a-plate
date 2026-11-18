// Frontend tests: run with `npm test` in frontend/.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, test } from 'vitest';
import OfferCard from '../components/OfferCard';

const inOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const baseOffer = {
  id: 7,
  title: 'Fresh sourdough loaves',
  description: 'Baked this morning.',
  category: 'bakery',
  area: 'old town',
  remaining_quantity: 5,
  quantity: 8,
  pickup_deadline: inOneDay,
  status: 'active',
};

function renderCard(offer, props = {}) {
  return render(
    <MemoryRouter>
      <OfferCard offer={offer} {...props} />
    </MemoryRouter>,
  );
}

describe('OfferCard', () => {
  test('shows the offer details and links to the offer page', () => {
    renderCard(baseOffer);
    expect(
      screen.getByRole('heading', { name: 'Fresh sourdough loaves' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/of 8 portions left/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Fresh sourdough loaves' }),
    ).toHaveAttribute('href', '/offers/7');
  });

  test('marks an offer with no portions left as sold out', () => {
    renderCard({ ...baseOffer, remaining_quantity: 0 }, { showStatus: true });
    expect(screen.getByText(/sold out/i)).toBeInTheDocument();
  });

  test('shows HTML typed by a user as plain text (XSS protection)', () => {
    const attack = '<img src=x onerror="alert(1)">';
    const { container } = renderCard({ ...baseOffer, title: attack });
    expect(screen.getByRole('heading', { name: attack })).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
