import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StandardWheel } from '../StandardWheel';
import { WHEEL_CONFIG, WheelWedge } from '../../engine/types';

/**
 * Build a minimal mock 24-wedge fixture with deterministic labels
 * so we can assert on exact per-glyph character counts.
 */
function buildMock24WedgeFixture(): WheelWedge[] {
  const wedges: WheelWedge[] = [];
  for (let i = 0; i < 22; i++) {
    wedges.push({
      id: `w${i}`,
      type: 'CASH',
      value: 100 + i * 50,
      label: `$${100 + i * 50}`,
      color: '#abcdef',
    });
  }
  wedges.push({
    id: 'bankrupt',
    type: 'BANKRUPT',
    value: 0,
    label: 'BANKRUPT',
    color: '#000000',
  });
  wedges.push({
    id: 'loseturn',
    type: 'LOSE_TURN',
    value: 0,
    label: 'LOSE A TURN',
    color: '#ffffff',
  });
  return wedges;
}

describe('StandardWheel', () => {
  it('renders exactly 24 wedge <path> elements', () => {
    const wedges = buildMock24WedgeFixture();
    const { container } = render(<StandardWheel wedges={wedges} />);

    const paths = container.querySelectorAll('path[data-testid^="wedge-"]');
    expect(paths.length).toBe(24);
  });

  it('renders one <text> element per character for every wedge label', () => {
    const wedges = buildMock24WedgeFixture();
    const { container } = render(<StandardWheel wedges={wedges} />);

    wedges.forEach((wedge, i) => {
      const labelGroup = container.querySelector(
        `g[data-testid="label-${i}"]`,
      );
      expect(labelGroup, `label group ${i} should exist`).toBeTruthy();

      const glyphs = labelGroup!.querySelectorAll('text');
      expect(
        glyphs.length,
        `wedge ${i} "${wedge.label}" should render ${wedge.label.length} glyph <text> elements`,
      ).toBe(wedge.label.length);

      // Verify each glyph contains exactly one character from the label, in order.
      wedge.label.split('').forEach((expectedChar, charIndex) => {
        expect(glyphs[charIndex].textContent).toBe(expectedChar);
      });
    });
  });

  it('places each glyph with an x, y, and rotate transform (manual placement, no textPath)', () => {
    const wedges = buildMock24WedgeFixture();
    const { container } = render(<StandardWheel wedges={wedges} />);

    // No textPath elements should be used (Safari bug mitigation).
    expect(container.querySelectorAll('textPath').length).toBe(0);

    // Every glyph text element must have x, y, and a rotate() transform.
    const glyphs = container.querySelectorAll('text[data-testid^="glyph-"]');
    expect(glyphs.length).toBeGreaterThan(0);
    glyphs.forEach((g) => {
      expect(g.getAttribute('x')).toBeTruthy();
      expect(g.getAttribute('y')).toBeTruthy();
      expect(g.getAttribute('transform')).toMatch(/rotate\(/);
    });
  });

  it('highlights the wedge specified by currentWedgeIndex', () => {
    const wedges = buildMock24WedgeFixture();
    const highlightIndex = 7;
    const { container } = render(
      <StandardWheel wedges={wedges} currentWedgeIndex={highlightIndex} />,
    );

    const highlighted = container.querySelector(
      `path[data-testid="wedge-${highlightIndex}"]`,
    );
    expect(highlighted).toBeTruthy();
    expect(highlighted!.getAttribute('data-current')).toBe('true');
    // Highlighted wedge uses a distinctive stroke (yellow) and thicker width.
    expect(highlighted!.getAttribute('stroke')).toBe('#facc15');

    // Sanity: a non-highlighted wedge should not carry the current marker.
    const other = container.querySelector('path[data-testid="wedge-0"]');
    expect(other!.getAttribute('data-current')).toBe('false');
    expect(other!.getAttribute('stroke')).not.toBe('#facc15');
  });

  it('does not highlight any wedge when currentWedgeIndex is omitted', () => {
    const wedges = buildMock24WedgeFixture();
    const { container } = render(<StandardWheel wedges={wedges} />);
    const currentPaths = container.querySelectorAll(
      'path[data-current="true"]',
    );
    expect(currentPaths.length).toBe(0);
  });

  it('works with the canonical 24-wedge WHEEL_CONFIG fixture', () => {
    const { container } = render(<StandardWheel wedges={WHEEL_CONFIG} />);
    const paths = container.querySelectorAll('path[data-testid^="wedge-"]');
    expect(paths.length).toBe(24);

    // Bankrupt wedges must be black filled.
    WHEEL_CONFIG.forEach((wedge, i) => {
      if (wedge.type === 'BANKRUPT') {
        const path = container.querySelector(
          `path[data-testid="wedge-${i}"]`,
        );
        expect(path!.getAttribute('fill')).toBe('#000000');
      }
      if (wedge.type === 'LOSE_TURN') {
        const path = container.querySelector(
          `path[data-testid="wedge-${i}"]`,
        );
        expect(path!.getAttribute('fill')).toBe('#ffffff');
      }
    });
  });

  it('respects the `size` prop on the rendered svg', () => {
    const wedges = buildMock24WedgeFixture();
    const { container } = render(<StandardWheel wedges={wedges} size={600} />);
    const svg = container.querySelector('svg[data-testid="standard-wheel"]');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('width')).toBe('600');
    expect(svg!.getAttribute('height')).toBe('600');
    expect(svg!.getAttribute('viewBox')).toBe('0 0 600 600');
  });
});
