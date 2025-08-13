import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('App', () => {
  it('renders the main application layout', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Check for the main title in the layout
    expect(screen.getAllByText('DevOps Agent')[0]).toBeInTheDocument();

    // Check for a navigation link
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
