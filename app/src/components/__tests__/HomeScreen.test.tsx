import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Home, MODE_CARDS } from '../../screens/Home';
import { RoundType } from '../../engine/types';

describe('Home screen', () => {
  it('renders exactly three mode cards', () => {
    render(<Home onSelectMode={() => {}} />);

    // MODE_CARDS should be the authoritative source.
    expect(MODE_CARDS).toHaveLength(3);

    const mainGame = screen.getByTestId('mode-card-MAIN');
    const tossUp = screen.getByTestId('mode-card-TOSSUP');
    const bonus = screen.getByTestId('mode-card-BONUS');

    expect(mainGame).toBeInTheDocument();
    expect(tossUp).toBeInTheDocument();
    expect(bonus).toBeInTheDocument();

    // Each card must be a real <button> for keyboard accessibility.
    expect(mainGame.tagName).toBe('BUTTON');
    expect(tossUp.tagName).toBe('BUTTON');
    expect(bonus.tagName).toBe('BUTTON');
  });

  it('displays the expected title for each mode card', () => {
    render(<Home onSelectMode={() => {}} />);

    expect(screen.getByText('Main Game')).toBeInTheDocument();
    expect(screen.getByText('Toss-Up')).toBeInTheDocument();
    expect(screen.getByText('Bonus Round')).toBeInTheDocument();
  });

  it('fires onSelectMode with MAIN when Main Game is clicked', () => {
    const onSelectMode = vi.fn<[RoundType], void>();
    render(<Home onSelectMode={onSelectMode} />);

    fireEvent.click(screen.getByTestId('mode-card-MAIN'));

    expect(onSelectMode).toHaveBeenCalledTimes(1);
    expect(onSelectMode).toHaveBeenCalledWith('MAIN');
  });

  it('fires onSelectMode with TOSSUP when Toss-Up is clicked', () => {
    const onSelectMode = vi.fn<[RoundType], void>();
    render(<Home onSelectMode={onSelectMode} />);

    fireEvent.click(screen.getByTestId('mode-card-TOSSUP'));

    expect(onSelectMode).toHaveBeenCalledTimes(1);
    expect(onSelectMode).toHaveBeenCalledWith('TOSSUP');
  });

  it('fires onSelectMode with BONUS when Bonus Round is clicked', () => {
    const onSelectMode = vi.fn<[RoundType], void>();
    render(<Home onSelectMode={onSelectMode} />);

    fireEvent.click(screen.getByTestId('mode-card-BONUS'));

    expect(onSelectMode).toHaveBeenCalledTimes(1);
    expect(onSelectMode).toHaveBeenCalledWith('BONUS');
  });

  it('does not fire onSelectMode on initial render', () => {
    const onSelectMode = vi.fn();
    render(<Home onSelectMode={onSelectMode} />);
    expect(onSelectMode).not.toHaveBeenCalled();
  });
});
