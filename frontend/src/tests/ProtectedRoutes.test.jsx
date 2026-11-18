import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, test } from 'vitest';
import App from '../app/App';
import { AuthProvider } from '../context/AuthContext';

test('visitors who are not signed in are sent to the sign-in page', () => {
  render(
    <MemoryRouter initialEntries={['/my-offers']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
});
