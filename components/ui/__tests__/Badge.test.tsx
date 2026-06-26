import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge component', () => {
  it('renders children correctly', () => {
    render(<Badge>New Item</Badge>);
    expect(screen.getByText('New Item')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Badge variant="high">High</Badge>);
    expect(screen.getByText('High')).toHaveClass('badge-high');

    rerender(<Badge variant="low">Low</Badge>);
    expect(screen.getByText('Low')).toHaveClass('badge-low');
    
    rerender(<Badge variant="productive">Productive</Badge>);
    expect(screen.getByText('Productive')).toHaveClass('badge-productive');
  });
});
