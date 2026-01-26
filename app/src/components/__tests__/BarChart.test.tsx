import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart } from '../BarChart';

describe('BarChart', () => {
  it('should render without crashing', () => {
    const data = [
      { label: 'A', value: 100, color: '#00ff00' },
      { label: 'B', value: 50, color: '#ffff00' }
    ];

    render(<BarChart data={data} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('should render all bar items', () => {
    const data = [
      { label: 'R', value: 75, color: '#00ff00' },
      { label: 'S', value: 70, color: '#00ff00' },
      { label: 'T', value: 65, color: '#ffff00' }
    ];

    render(<BarChart data={data} />);

    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('should show values when showValues is true', () => {
    const data = [
      { label: 'A', value: 85.5, color: '#00ff00' }
    ];

    const { container } = render(<BarChart data={data} showValues={true} />);
    // Check for the permanent value display (not the hover tooltip)
    const valueDisplay = container.querySelector('.w-16.text-right.font-mono');
    expect(valueDisplay).toBeInTheDocument();
    expect(valueDisplay?.textContent).toBe('85.5%');
  });

  it('should not show values when showValues is false', () => {
    const data = [
      { label: 'A', value: 85.5, color: '#00ff00' }
    ];

    const { container } = render(<BarChart data={data} showValues={false} />);
    // Check that the permanent value display is not present
    const valueDisplay = container.querySelector('.w-16.text-right.font-mono');
    expect(valueDisplay).not.toBeInTheDocument();
  });

  it('should default to not showing values', () => {
    const data = [
      { label: 'A', value: 85.5, color: '#00ff00' }
    ];

    const { container } = render(<BarChart data={data} />);
    // Check that the permanent value display is not present
    const valueDisplay = container.querySelector('.w-16.text-right.font-mono');
    expect(valueDisplay).not.toBeInTheDocument();
  });

  it('should handle empty data array', () => {
    render(<BarChart data={[]} />);
    // Should not crash, just render empty container
    expect(screen.queryByRole('list')).toBeInTheDocument();
  });

  it('should apply custom height', () => {
    const data = [
      { label: 'A', value: 50, color: '#00ff00' }
    ];

    const { container } = render(<BarChart data={data} height={500} />);
    const chartContainer = container.querySelector('[style*="max-height"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render bars with correct width based on value', () => {
    const data = [
      { label: 'A', value: 100, color: '#00ff00' },
      { label: 'B', value: 50, color: '#ffff00' },
      { label: 'C', value: 25, color: '#ff9900' }
    ];

    const { container } = render(<BarChart data={data} />);
    const bars = container.querySelectorAll('[role="progressbar"]');

    // Each bar should have width based on value (0-100%)
    expect(bars[0]).toHaveStyle({ width: '100%' });
    expect(bars[1]).toHaveStyle({ width: '50%' });
    expect(bars[2]).toHaveStyle({ width: '25%' });
  });

  it('should apply color from data', () => {
    const data = [
      { label: 'A', value: 50, color: '#ff0000' }
    ];

    const { container } = render(<BarChart data={data} />);
    const bar = container.querySelector('[role="progressbar"]');

    expect(bar).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});
