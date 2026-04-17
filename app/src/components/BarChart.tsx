/**
 * BarChart Component
 *
 * Simple CSS-based horizontal bar chart (no external library)
 * Features:
 * - Animated bars with CSS transitions
 * - Color-coded by frequency
 * - Responsive to container width
 * - Optional value display
 */

import React from 'react';

export interface BarChartProps {
  data: Array<{
    label: string;
    value: number; // 0-100
    color: string;
  }>;
  height?: number;
  showValues?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 400,
  showValues = false
}) => {
  return (
    <div
      className="w-full overflow-y-auto"
      style={{ maxHeight: `${height}px` }}
      role="list"
      aria-label="Bar chart"
    >
      <div className="space-y-2">
        {data.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex items-center gap-3 group"
            role="listitem"
          >
            {/* Label */}
            <div className="w-8 text-right font-mono font-bold text-white flex-shrink-0">
              {item.label}
            </div>

            {/* Bar container */}
            <div className="flex-1 relative h-8 bg-slate-700/30 rounded-lg overflow-hidden">
              {/* Bar fill */}
              <div
                role="progressbar"
                aria-valuenow={item.value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.label}: ${item.value}%`}
                className="h-full rounded-lg transition-all duration-700 ease-out"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.color
                }}
                title={`${item.label}: ${item.value.toFixed(1)}%`}
              />

              {/* Value overlay (on hover) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-white font-bold text-sm bg-black/70 px-2 py-1 rounded">
                  {item.value.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Value display (if enabled) */}
            {showValues && (
              <div className="w-16 text-right font-mono text-sm text-slate-300 flex-shrink-0">
                {item.value.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
