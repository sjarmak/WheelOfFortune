/**
 * Strategy Dashboard Component
 *
 * Full-screen modal displaying strategy analytics:
 * - Letter frequency analysis
 * - Optimal strategy recommendations
 * - Wheel probability analysis
 * - Category-specific insights
 */

import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Target, Percent, Grid } from 'lucide-react';
import { BarChart } from './BarChart';
import type { PuzzleCorpusAnalytics } from '../engine/strategyAnalytics';

interface StrategyDashboardProps {
  analytics: PuzzleCorpusAnalytics;
  currentCategory?: string;
  onClose: () => void;
}

type TabType = 'frequency' | 'strategy' | 'wheel' | 'categories';

export const StrategyDashboard: React.FC<StrategyDashboardProps> = ({
  analytics,
  currentCategory,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('frequency');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    currentCategory || analytics.categoryBreakdown[0]?.category || ''
  );

  // Color code letters by frequency
  const getFrequencyColor = (rate: number): string => {
    if (rate >= 70) return '#22c55e'; // green
    if (rate >= 40) return '#eab308'; // yellow
    if (rate >= 20) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  // Prepare data for bar chart
  const chartData = useMemo(() => {
    return analytics.letterFrequencies.map(freq => ({
      label: freq.letter,
      value: freq.occurrenceRate,
      color: getFrequencyColor(freq.occurrenceRate)
    }));
  }, [analytics.letterFrequencies]);

  // Category-specific chart data
  const categoryChartData = useMemo(() => {
    const category = analytics.categoryBreakdown.find(c => c.category === selectedCategory);
    if (!category) return [];

    return category.letterFrequencies.slice(0, 15).map(freq => ({
      label: freq.letter,
      value: freq.occurrenceRate,
      color: getFrequencyColor(freq.occurrenceRate)
    }));
  }, [analytics.categoryBreakdown, selectedCategory]);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-400" />
            Strategy Analytics
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Based on {analytics.totalPuzzles.toLocaleString()} puzzles
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-4 border-b border-slate-700 overflow-x-auto flex-shrink-0">
        {[
          { id: 'frequency', label: 'Letter Frequency', icon: Percent },
          { id: 'strategy', label: 'Optimal Strategy', icon: Target },
          { id: 'wheel', label: 'Wheel Analysis', icon: TrendingUp },
          { id: 'categories', label: 'Category Insights', icon: Grid },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'frequency' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Letter Frequency Analysis</h3>
              <p className="text-slate-400 mb-6">
                Percentage of puzzles containing each letter (A-Z). Higher percentages mean the letter
                appears more often across the puzzle corpus.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-green-400">●</span> {'>'} 70% (Very Common)
                <span className="text-yellow-400 ml-4">●</span> 40-70% (Common)
                <span className="text-orange-400 ml-4">●</span> 20-40% (Uncommon)
                <span className="text-red-400 ml-4">●</span> {'<'} 20% (Rare)
              </h4>
              <BarChart data={chartData} height={600} showValues={false} />
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Optimal Strategy</h3>
              <p className="text-slate-400 mb-6">
                Data-driven recommendations for maximizing your chances of solving puzzles.
              </p>
            </div>

            {/* Best First Guesses */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h4 className="text-xl font-bold mb-4">Best First Guesses (RSTLNE Order)</h4>
              <div className="flex flex-wrap gap-3 mb-4">
                {analytics.recommendations.optimalFirstGuesses.map((letter, index) => {
                  const freq = analytics.letterFrequencies.find(f => f.letter === letter);
                  return (
                    <div
                      key={letter}
                      className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 min-w-[120px] text-center shadow-lg"
                    >
                      <div className="text-sm text-blue-200 mb-1">#{index + 1}</div>
                      <div className="text-4xl font-bold mb-2">{letter}</div>
                      <div className="text-sm text-blue-200">
                        {freq?.occurrenceRate.toFixed(1)}% of puzzles
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-slate-400">
                These letters appear in the highest percentage of puzzles and should be your priority guesses.
              </p>
            </div>

            {/* Top Consonants */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h4 className="text-xl font-bold mb-4">Top 5 Consonants</h4>
              <div className="grid grid-cols-5 gap-3">
                {analytics.recommendations.topConsonants.map(letter => {
                  const freq = analytics.letterFrequencies.find(f => f.letter === letter);
                  return (
                    <div key={letter} className="bg-slate-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">{letter}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {freq?.occurrenceRate.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Vowels */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h4 className="text-xl font-bold mb-4">Top 5 Vowels</h4>
              <div className="grid grid-cols-5 gap-3">
                {analytics.recommendations.topVowels.map(letter => {
                  const freq = analytics.letterFrequencies.find(f => f.letter === letter);
                  return (
                    <div key={letter} className="bg-slate-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">{letter}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {freq?.occurrenceRate.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vowel Buying Strategy */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-700">
              <h4 className="text-xl font-bold mb-3">💰 Vowel Buying Strategy</h4>
              <p className="text-slate-300 mb-2">
                <strong>Recommended threshold:</strong> ${analytics.recommendations.vowelBuyThreshold.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">
                Wait until you have at least this much before buying vowels. This protects you from
                bankruptcy (8.33% chance) wiping out your vowel investment.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'wheel' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Wheel Probability Analysis</h3>
              <p className="text-slate-400 mb-6">
                Statistical analysis of the 24-wedge Wheel of Fortune wheel.
              </p>
            </div>

            {/* Expected Value */}
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-lg p-8 border border-green-700">
              <h4 className="text-xl font-bold mb-3">Expected Value Per Spin</h4>
              <div className="text-5xl font-bold text-green-400 mb-2">
                ${Math.round(analytics.wheelAnalysis.expectedValue).toLocaleString()}
              </div>
              <p className="text-sm text-slate-400">
                Average value you can expect from each spin of the wheel
              </p>
            </div>

            {/* Probability Breakdown */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h4 className="text-xl font-bold mb-4">Outcome Probabilities</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-900/30 rounded-lg">
                  <span className="font-medium">💰 Cash</span>
                  <span className="text-2xl font-bold text-green-400">
                    {analytics.wheelAnalysis.cashProbability.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-900/30 rounded-lg">
                  <span className="font-medium">💥 Bankrupt</span>
                  <span className="text-2xl font-bold text-red-400">
                    {analytics.wheelAnalysis.bankruptProbability.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-900/30 rounded-lg">
                  <span className="font-medium">🚫 Lose Turn</span>
                  <span className="text-2xl font-bold text-orange-400">
                    {analytics.wheelAnalysis.loseTurnProbability.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Average Cash Value */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h4 className="text-xl font-bold mb-3">Average Cash Value</h4>
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                ${Math.round(analytics.wheelAnalysis.avgCashValue).toLocaleString()}
              </div>
              <p className="text-sm text-slate-400">
                When you land on a cash wedge, this is the average value
              </p>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Category-Specific Insights</h3>
              <p className="text-slate-400 mb-6">
                Different puzzle categories may have unique letter patterns.
              </p>
            </div>

            {/* Category Selector */}
            <div className="bg-slate-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Select Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                {analytics.categoryBreakdown.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Analysis */}
            {(() => {
              const category = analytics.categoryBreakdown.find(c => c.category === selectedCategory);
              if (!category) return null;

              return (
                <>
                  {/* Letter Frequencies for Category */}
                  <div className="bg-slate-800 rounded-lg p-6">
                    <h4 className="text-xl font-bold mb-4">
                      Top Letters in "{category.category}"
                    </h4>
                    <BarChart data={categoryChartData} height={400} showValues={false} />
                  </div>

                  {/* Vowel Ratio */}
                  <div className="bg-slate-800 rounded-lg p-6">
                    <h4 className="text-xl font-bold mb-3">Vowel Ratio</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-8 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                          style={{ width: `${(category.vowelRatio * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {(category.vowelRatio * 100).toFixed(1)}%
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                      Percentage of letters that are vowels in this category
                    </p>
                  </div>

                  {/* Common Patterns */}
                  {category.commonPatterns.length > 0 && (
                    <div className="bg-slate-800 rounded-lg p-6">
                      <h4 className="text-xl font-bold mb-3">Common Patterns</h4>
                      <div className="flex flex-wrap gap-2">
                        {category.commonPatterns.map(pattern => (
                          <span
                            key={pattern}
                            className="px-4 py-2 bg-blue-900/50 text-blue-200 rounded-lg font-mono font-bold border border-blue-700"
                          >
                            {pattern}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-slate-400 mt-3">
                        Letter combinations that appear frequently in this category
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
