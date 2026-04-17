/**
 * StandardWheel — Static 24-wedge SVG wheel (DOM / web)
 *
 * Renders the 24-wedge Wheel of Fortune layout as inline SVG with manual
 * per-glyph `<text x y rotate>` placement for radial labels.
 *
 * Animation is intentionally out of scope for this unit; the SVG is static.
 * This component accepts a `currentWedgeIndex` so the caller can highlight
 * the wedge currently at the pointer.
 *
 * Why manual per-glyph placement instead of `<textPath startOffset>`:
 * Safari has a long-standing bug where `startOffset` is miscomputed on
 * short radial paths, causing characters to bunch up or disappear. Since
 * iPad (Safari / WebKit) is the primary target, we place every glyph
 * individually using (x, y) + `rotate` attributes.
 */
import React from 'react';
import { WheelWedge } from '../engine/types';

/**
 * Fallback cycling palette used when a wedge doesn't specify its own color.
 * BANKRUPT and LOSE_TURN are rendered with fixed colors regardless of palette.
 */
const DEFAULT_PALETTE = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9']; // rose, amber, emerald, sky

const BANKRUPT_FILL = '#000000';
const LOSE_TURN_FILL = '#ffffff';

export interface StandardWheelProps {
  /** 24-wedge array describing the wheel layout. */
  wedges: WheelWedge[];
  /** Optional index of the wedge currently under the pointer; receives highlight stroke. */
  currentWedgeIndex?: number;
  /** Reserved: caller receives this when the wheel finishes spinning. Not invoked yet (static). */
  onSpinComplete?: (wedge: WheelWedge) => void;
  /** Overall pixel size of the rendered SVG (width == height). Default 400. */
  size?: number;
}

interface WedgeGeometry {
  pathD: string;
  fill: string;
  textFill: string;
  label: string;
  midAngleDeg: number;
}

/** Convert polar (angleDeg measured from +x axis, CCW) to cartesian. */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/**
 * Build the geometry for a single wedge.
 *
 * Angles are measured from +x axis (standard SVG convention). Wedge 0 is
 * centered at the top (pointer location), which means its midpoint is at
 * -90deg. Wedges proceed clockwise.
 */
function buildWedgeGeometry(
  wedge: WheelWedge,
  index: number,
  totalWedges: number,
  centerX: number,
  centerY: number,
  outerRadius: number,
): WedgeGeometry {
  const wedgeAngle = 360 / totalWedges;
  // Wedge 0 straddles the top (pointer): start = -90 - wedgeAngle/2
  const startDeg = -90 - wedgeAngle / 2 + index * wedgeAngle;
  const endDeg = startDeg + wedgeAngle;
  const midDeg = startDeg + wedgeAngle / 2;

  const start = polarToCartesian(centerX, centerY, outerRadius, startDeg);
  const end = polarToCartesian(centerX, centerY, outerRadius, endDeg);

  const pathD = [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');

  let fill: string;
  let textFill: string;
  if (wedge.type === 'BANKRUPT') {
    fill = BANKRUPT_FILL;
    textFill = '#ffffff';
  } else if (wedge.type === 'LOSE_TURN') {
    fill = LOSE_TURN_FILL;
    textFill = '#000000';
  } else {
    // Prefer explicit wedge.color if provided, otherwise cycle the palette.
    fill = wedge.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
    textFill = '#000000';
  }

  return {
    pathD,
    fill,
    textFill,
    label: wedge.label,
    midAngleDeg: midDeg,
  };
}

interface GlyphPlacement {
  char: string;
  x: number;
  y: number;
  rotation: number;
}

/**
 * Place each character of a label along the wedge's radial midline.
 *
 * Characters are spaced evenly between `innerRadius` and `outerTextRadius`
 * so the first character sits near the center and the last sits near the rim.
 * Each glyph is rotated so it reads outward along the radial axis.
 */
function placeLabelGlyphs(
  label: string,
  midAngleDeg: number,
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerTextRadius: number,
): GlyphPlacement[] {
  const chars = Array.from(label);
  if (chars.length === 0) return [];

  const span = outerTextRadius - innerRadius;
  // For a single char, place at the mid-radius.
  const step = chars.length === 1 ? 0 : span / (chars.length - 1);
  // SVG rotate on a text element rotates around (x, y). We want each glyph's
  // local "up" to point outward from the wheel center. The angle from center
  // outward is midAngleDeg; text baseline runs along +x in unrotated form,
  // so we add 90 so glyphs read radially outward.
  const glyphRotation = midAngleDeg + 90;

  return chars.map((char, i) => {
    const radius = innerRadius + step * i;
    const { x, y } = polarToCartesian(centerX, centerY, radius, midAngleDeg);
    return { char, x, y, rotation: glyphRotation };
  });
}

export function StandardWheel({
  wedges,
  currentWedgeIndex,
  size = 400,
}: StandardWheelProps): React.JSX.Element {
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2;
  // Leave a small gutter so text never crosses the rim.
  const innerTextRadius = outerRadius * 0.2;
  const outerTextRadius = outerRadius * 0.82;

  const geometries = wedges.map((wedge, i) =>
    buildWedgeGeometry(wedge, i, wedges.length, centerX, centerY, outerRadius),
  );

  return (
    <svg
      data-testid="standard-wheel"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Wheel of Fortune"
    >
      {/* Wedge fills */}
      <g data-testid="wedges">
        {geometries.map((geom, i) => {
          const isCurrent = currentWedgeIndex === i;
          return (
            <path
              key={`wedge-${i}`}
              data-testid={`wedge-${i}`}
              data-current={isCurrent ? 'true' : 'false'}
              d={geom.pathD}
              fill={geom.fill}
              stroke={isCurrent ? '#facc15' : '#1f2937'}
              strokeWidth={isCurrent ? 3 : 0.5}
            />
          );
        })}
      </g>

      {/* Manually-placed radial glyphs (one <text> per glyph, with rotate). */}
      <g data-testid="labels">
        {geometries.map((geom, i) => {
          const glyphs = placeLabelGlyphs(
            geom.label,
            geom.midAngleDeg,
            centerX,
            centerY,
            innerTextRadius,
            outerTextRadius,
          );
          const fontSize = Math.max(8, Math.min(16, size / 28));
          return (
            <g key={`label-${i}`} data-testid={`label-${i}`}>
              {glyphs.map((g, j) => (
                <text
                  key={`glyph-${i}-${j}`}
                  data-testid={`glyph-${i}-${j}`}
                  x={g.x}
                  y={g.y}
                  transform={`rotate(${g.rotation} ${g.x} ${g.y})`}
                  fill={geom.textFill}
                  fontSize={fontSize}
                  fontWeight={700}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {g.char}
                </text>
              ))}
            </g>
          );
        })}
      </g>

      {/* Center hub (purely decorative; not required by acceptance criteria). */}
      <circle
        cx={centerX}
        cy={centerY}
        r={size * 0.05}
        fill="#1f2937"
        stroke="#facc15"
        strokeWidth={2}
      />
    </svg>
  );
}
