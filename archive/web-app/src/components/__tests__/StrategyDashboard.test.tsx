import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategyDashboard } from '../StrategyDashboard';
import type { PuzzleCorpusAnalytics } from '../../engine/strategyAnalytics';

const mockAnalytics: PuzzleCorpusAnalytics = {
  totalPuzzles: 100,
  letterFrequencies: [
    { letter: 'E', occurrenceRate: 85, avgOccurrencesPerPuzzle: 3.2, totalCount: 320 },
    { letter: 'A', occurrenceRate: 75, avgOccurrencesPerPuzzle: 2.8, totalCount: 280 },
    { letter: 'R', occurrenceRate: 70, avgOccurrencesPerPuzzle: 2.5, totalCount: 250 },
    { letter: 'S', occurrenceRate: 68, avgOccurrencesPerPuzzle: 2.3, totalCount: 230 },
    { letter: 'T', occurrenceRate: 65, avgOccurrencesPerPuzzle: 2.1, totalCount: 210 },
  ],
  categoryBreakdown: [
    {
      category: 'TEST_CATEGORY',
      letterFrequencies: [
        { letter: 'T', occurrenceRate: 80, avgOccurrencesPerPuzzle: 3.0, totalCount: 300 },
      ],
      vowelRatio: 0.35,
      commonPatterns: ['TH', 'ER', 'ING']
    }
  ],
  recommendations: {
    topConsonants: ['R', 'S', 'T', 'L', 'N'],
    topVowels: ['E', 'A', 'I', 'O', 'U'],
    optimalFirstGuesses: ['R', 'S', 'T', 'L', 'N', 'E'],
    categorySpecific: new Map(),
    vowelBuyThreshold: 1000
  },
  wheelAnalysis: {
    expectedValue: 680,
    bankruptProbability: 8.33,
    loseTurnProbability: 4.17,
    freePlayProbability: 4.17,
    cashProbability: 83.33,
    avgCashValue: 705
  }
};

describe('StrategyDashboard', () => {
  it('should render without crashing', () => {
    const onClose = vi.fn();
    render(<StrategyDashboard analytics={mockAnalytics} onClose={onClose} />);

    expect(screen.getByText('Strategy Analytics')).toBeInTheDocument();
    expect(screen.getByText('Based on 100 puzzles')).toBeInTheDocument();
  });

  it('should display all tabs', () => {
    const onClose = vi.fn();
    render(<StrategyDashboard analytics={mockAnalytics} onClose={onClose} />);

    expect(screen.getByText('Letter Frequency')).toBeInTheDocument();
    expect(screen.getByText('Optimal Strategy')).toBeInTheDocument();
    expect(screen.getByText('Wheel Analysis')).toBeInTheDocument();
    expect(screen.getByText('Category Insights')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<StrategyDashboard analytics={mockAnalytics} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should switch tabs when tab buttons are clicked', () => {
    const onClose = vi.fn();
    render(<StrategyDashboard analytics={mockAnalytics} onClose={onClose} />);

    // Initially on Letter Frequency tab
    expect(screen.getByText('Letter Frequency Analysis')).toBeInTheDocument();

    // Click Optimal Strategy tab
    fireEvent.click(screen.getByText('Optimal Strategy'));
    expect(screen.getByText('Best First Guesses (RSTLNE Order)')).toBeInTheDocument();

    // Click Wheel Analysis tab
    fireEvent.click(screen.getByText('Wheel Analysis'));
    expect(screen.getByText('Expected Value Per Spin')).toBeInTheDocument();

    // Click Category Insights tab
    fireEvent.click(screen.getByText('Category Insights'));
    expect(screen.getByText('Category-Specific Insights')).toBeInTheDocument();
  });

  it('should display letter frequency data', () => {
    const onClose = vi.fn();
    render(<StrategyDashboard analytics={mockAnalytics} onClose={onClose} />);

    // Should show letters
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('should display optimal strategy recommendations', () => {
    const onClose = vi.fn();
    render(<StrategyDashboard analytics={mockAnalytics} onClose={onClose} />);

    fireEvent.click(screen.getByText('Optimal Strategy'));

    expect(screen.getByText('Top 5 Consonants')).toBeInTheDocument();
    expect(screen.getByText('Top 5 Vowels')).toBeInTheDocument();
    expect(screen.getByText('💰 Vowel Buying Strategy')).toBeInTheDocument();
  });

  it('should display wheel analysis data', () => {
    const onClose = vi.fn();
    render(<StrategyDashboard analytics={mockAnalytics} onClose={onClose} />);

    fireEvent.click(screen.getByText('Wheel Analysis'));

    expect(screen.getByText('$680')).toBeInTheDocument(); // Expected value
    expect(screen.getByText('💰 Cash')).toBeInTheDocument();
    expect(screen.getByText('💥 Bankrupt')).toBeInTheDocument();
    expect(screen.getByText('🚫 Lose Turn')).toBeInTheDocument();
    expect(screen.getByText('🎁 Free Play')).toBeInTheDocument();
  });

  it('should display category insights', () => {
    const onClose = vi.fn();
    render(<StrategyDashboard analytics={mockAnalytics} onClose={onClose} />);

    fireEvent.click(screen.getByText('Category Insights'));

    expect(screen.getByText('Select Category')).toBeInTheDocument();
    expect(screen.getByText('Vowel Ratio')).toBeInTheDocument();
    expect(screen.getByText('Common Patterns')).toBeInTheDocument();
  });
});
