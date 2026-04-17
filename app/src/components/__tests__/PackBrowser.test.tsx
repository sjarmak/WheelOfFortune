import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PackBrowser } from '../../screens/PackBrowser';
import { PuzzlePack } from '../../engine/packs';

function makePack(overrides: Partial<PuzzlePack> = {}): PuzzlePack {
  return {
    id: 'test-pack',
    name: 'Test Pack',
    description: 'A test pack',
    source: 'test',
    puzzleCount: 3,
    categories: ['PHRASE'],
    difficultyRange: [0, 1],
    puzzles: [
      {
        id: 'p1',
        phrase: 'HELLO WORLD',
        category: 'PHRASE',
        round_type: 'MAIN',
      },
      {
        id: 'p2',
        phrase: 'FOO BAR',
        category: 'PHRASE',
        round_type: 'MAIN',
      },
      {
        id: 'p3',
        phrase: 'BAZ QUX',
        category: 'PHRASE',
        round_type: 'MAIN',
      },
    ],
    ...overrides,
  };
}

describe('PackBrowser screen', () => {
  it('renders one card per pack', () => {
    const packs: PuzzlePack[] = [
      makePack({ id: 'a', name: 'Pack A' }),
      makePack({ id: 'b', name: 'Pack B' }),
    ];

    render(<PackBrowser packs={packs} onSelectPack={() => {}} />);

    expect(screen.getByTestId('pack-card-a')).toBeInTheDocument();
    expect(screen.getByTestId('pack-card-b')).toBeInTheDocument();
    expect(screen.getByText('Pack A')).toBeInTheDocument();
    expect(screen.getByText('Pack B')).toBeInTheDocument();
  });

  it('invokes onSelectPack with the selected pack when clicked', () => {
    const packs = [
      makePack({ id: 'a', name: 'Pack A' }),
      makePack({ id: 'b', name: 'Pack B' }),
    ];
    const onSelectPack = vi.fn<[PuzzlePack], void>();

    render(<PackBrowser packs={packs} onSelectPack={onSelectPack} />);

    fireEvent.click(screen.getByTestId('pack-card-b'));

    expect(onSelectPack).toHaveBeenCalledTimes(1);
    expect(onSelectPack).toHaveBeenCalledWith(packs[1]);
  });

  it('renders a back button only when onBack is provided', () => {
    const packs = [makePack()];
    const { rerender } = render(
      <PackBrowser packs={packs} onSelectPack={() => {}} />,
    );

    expect(screen.queryByLabelText('Back to home')).not.toBeInTheDocument();

    const onBack = vi.fn();
    rerender(
      <PackBrowser packs={packs} onSelectPack={() => {}} onBack={onBack} />,
    );

    const backBtn = screen.getByLabelText('Back to home');
    expect(backBtn).toBeInTheDocument();

    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('marks the active pack with aria-pressed=true', () => {
    const packs = [
      makePack({ id: 'a', name: 'Pack A' }),
      makePack({ id: 'b', name: 'Pack B' }),
    ];

    render(
      <PackBrowser
        packs={packs}
        onSelectPack={() => {}}
        activePackId="b"
      />,
    );

    expect(screen.getByTestId('pack-card-a')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByTestId('pack-card-b')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders an empty-state message when no packs are provided', () => {
    render(<PackBrowser packs={[]} onSelectPack={() => {}} />);
    expect(screen.getByText(/no puzzle packs available/i)).toBeInTheDocument();
  });
});
