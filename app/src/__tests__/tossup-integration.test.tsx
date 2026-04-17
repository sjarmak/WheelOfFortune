import React, { useReducer } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { gameReducer, INITIAL_STATE, GameAction } from '../engine/game';
import { Puzzle } from '../engine/types';
import { TossUpScreen } from '../screens/TossUpScreen';

/**
 * Integration test for the Toss-Up UI layer.
 *
 * Drives the real reducer + real TossUpScreen component (no mocks) through
 * the full reveal -> buzz -> solve flow and asserts the observable state
 * transitions (turnState, revealedPositions, roundResult).
 */

const TOSSUP_PUZZLE: Puzzle = {
  id: 'tossup-test-1',
  phrase: 'HELLO WORLD',
  category: 'PHRASE',
  round_type: 'TOSSUP',
};

// Harness that wires the reducer to the TossUpScreen and lets tests observe
// the latest state + dispatch arbitrary actions.
interface HarnessProps {
  onRef: (api: {
    getState: () => ReturnType<typeof gameReducer>;
    dispatch: React.Dispatch<GameAction>;
  }) => void;
}

function Harness({ onRef }: HarnessProps) {
  const [state, dispatch] = useReducer(
    gameReducer,
    INITIAL_STATE,
    (initial) => gameReducer(initial, { type: 'START_ROUND', puzzle: TOSSUP_PUZZLE, seed: 42 })
  );
  React.useEffect(() => {
    onRef({ getState: () => state, dispatch });
  });
  return <TossUpScreen gameState={state} dispatch={dispatch} />;
}

describe('TossUpScreen integration', () => {
  it('starts in TOSSUP_REVEALING after START_ROUND for a TOSSUP puzzle', () => {
    let api: any;
    render(<Harness onRef={(a) => { api = a; }} />);
    expect(api.getState().turnState).toBe('TOSSUP_REVEALING');
    expect(api.getState().revealedPositions).toEqual([]);
    expect(screen.getByTestId('tossup-screen')).toBeInTheDocument();
    expect(screen.getByTestId('tossup-buzz-button')).toBeInTheDocument();
  });

  it('progressively reveals letters on TOSS_UP_TICK', () => {
    let api: any;
    render(<Harness onRef={(a) => { api = a; }} />);

    const before = api.getState().revealedPositions.length;
    act(() => { api.dispatch({ type: 'TOSS_UP_TICK' }); });
    const afterOne = api.getState().revealedPositions.length;
    expect(afterOne).toBe(before + 1);

    act(() => { api.dispatch({ type: 'TOSS_UP_TICK' }); });
    act(() => { api.dispatch({ type: 'TOSS_UP_TICK' }); });
    expect(api.getState().revealedPositions.length).toBe(before + 3);
  });

  it('clicking Buzz transitions to TOSSUP_BUZZED and shows solve input', async () => {
    const user = userEvent.setup();
    let api: any;
    render(<Harness onRef={(a) => { api = a; }} />);

    await user.click(screen.getByTestId('tossup-buzz-button'));

    expect(api.getState().turnState).toBe('TOSSUP_BUZZED');
    expect(screen.getByTestId('tossup-solve-input')).toBeInTheDocument();
  });

  it('Cancel dispatches CANCEL_TOSS_UP_ATTEMPT and returns to TOSSUP_REVEALING', async () => {
    const user = userEvent.setup();
    let api: any;
    render(<Harness onRef={(a) => { api = a; }} />);

    await user.click(screen.getByTestId('tossup-buzz-button'));
    expect(api.getState().turnState).toBe('TOSSUP_BUZZED');

    await user.click(screen.getByTestId('tossup-cancel-button'));
    expect(api.getState().turnState).toBe('TOSSUP_REVEALING');
    expect(screen.getByTestId('tossup-buzz-button')).toBeInTheDocument();
  });

  it('submitting the CORRECT phrase transitions to ROUND_OVER with roundResult WIN and all positions revealed', async () => {
    const user = userEvent.setup();
    let api: any;
    render(<Harness onRef={(a) => { api = a; }} />);

    await user.click(screen.getByTestId('tossup-buzz-button'));
    const input = screen.getByTestId('tossup-solve-input') as HTMLInputElement;

    await user.type(input, 'hello world');
    fireEvent.submit(screen.getByTestId('tossup-solve-form'));

    const s = api.getState();
    expect(s.turnState).toBe('ROUND_OVER');
    expect(s.roundResult).toBe('WIN');
    // Every position in the phrase is revealed on a correct solve
    expect(s.revealedPositions.length).toBe(TOSSUP_PUZZLE.phrase.length);
  });

  it('submitting an INCORRECT phrase transitions to TOSSUP_LOCKED_OUT with roundResult LOSS', async () => {
    const user = userEvent.setup();
    let api: any;
    render(<Harness onRef={(a) => { api = a; }} />);

    await user.click(screen.getByTestId('tossup-buzz-button'));
    const input = screen.getByTestId('tossup-solve-input') as HTMLInputElement;

    await user.type(input, 'WRONG ANSWER');
    fireEvent.submit(screen.getByTestId('tossup-solve-form'));

    const s = api.getState();
    expect(s.turnState).toBe('TOSSUP_LOCKED_OUT');
    expect(s.roundResult).toBe('LOSS');
    expect(screen.getByTestId('tossup-locked-out')).toBeInTheDocument();
  });

  it('BUZZ_IN is ignored when not in TOSSUP_REVEALING (reducer guards state)', () => {
    let api: any;
    render(<Harness onRef={(a) => { api = a; }} />);

    act(() => { api.dispatch({ type: 'BUZZ_IN' }); });
    expect(api.getState().turnState).toBe('TOSSUP_BUZZED');

    // Re-dispatching BUZZ_IN while already buzzed should be a no-op
    act(() => { api.dispatch({ type: 'BUZZ_IN' }); });
    expect(api.getState().turnState).toBe('TOSSUP_BUZZED');
  });

  it('TOSS_UP_TICK does not advance reveal while player is buzzed in', () => {
    let api: any;
    render(<Harness onRef={(a) => { api = a; }} />);

    act(() => { api.dispatch({ type: 'TOSS_UP_TICK' }); });
    const revealedBeforeBuzz = api.getState().revealedPositions.length;

    act(() => { api.dispatch({ type: 'BUZZ_IN' }); });
    act(() => { api.dispatch({ type: 'TOSS_UP_TICK' }); });
    act(() => { api.dispatch({ type: 'TOSS_UP_TICK' }); });

    // While BUZZED, ticks must be frozen
    expect(api.getState().revealedPositions.length).toBe(revealedBeforeBuzz);
  });
});
