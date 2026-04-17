import React, { useState, useMemo } from 'react';
import { X, Play, Shuffle, ChevronRight, Zap, Target, Trophy } from 'lucide-react';
import type { PuzzlePack } from '../engine/packs';

interface PackSelectorProps {
  packs: PuzzlePack[];
  currentPackId?: string;
  onSelectPack: (pack: PuzzlePack) => void;
  onClose: () => void;
}

type FilterType = 'all' | 'quick' | 'difficulty' | 'full' | 'season';

export const PackSelector: React.FC<PackSelectorProps> = ({
  packs,
  currentPackId,
  onSelectPack,
  onClose,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredPacks = useMemo(() => {
    switch (filter) {
      case 'quick':
        return packs.filter(p => p.source === 'random' || p.puzzleCount <= 50);
      case 'difficulty':
        return packs.filter(p => 
          p.id.includes('-easy') || p.id.includes('-medium') || p.id.includes('-hard')
        );
      case 'full':
        return packs.filter(p => 
          p.puzzleCount > 50 && !p.id.includes('-easy') && !p.id.includes('-medium') && !p.id.includes('-hard')
        );
      case 'season':
        return packs.filter(p => p.id.startsWith('season-'));
      default:
        return packs;
    }
  }, [packs, filter]);

  const getDifficultyColor = (range: [number, number]) => {
    const avg = (range[0] + range[1]) / 2;
    if (avg < 0.3) return 'text-green-400';
    if (avg < 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getDifficultyLabel = (range: [number, number]) => {
    const avg = (range[0] + range[1]) / 2;
    if (avg < 0.3) return 'Easy';
    if (avg < 0.5) return 'Medium';
    return 'Hard';
  };

  const getPackIcon = (pack: PuzzlePack) => {
    if (pack.source === 'random') return <Shuffle size={20} className="text-purple-400" />;
    if (pack.id.includes('-easy')) return <Zap size={20} className="text-green-400" />;
    if (pack.id.includes('-hard')) return <Trophy size={20} className="text-red-400" />;
    if (pack.id.includes('-medium')) return <Target size={20} className="text-yellow-400" />;
    return <Play size={20} className="text-blue-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white">Select Puzzle Pack</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-full"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-4 border-b border-slate-700 overflow-x-auto">
        {[
          { id: 'all', label: 'All Packs' },
          { id: 'quick', label: 'Quick Games' },
          { id: 'season', label: 'By Season' },
          { id: 'difficulty', label: 'By Difficulty' },
          { id: 'full', label: 'Full Collections' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pack List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-3 max-w-2xl mx-auto">
          {filteredPacks.map(pack => (
            <button
              key={pack.id}
              onClick={() => onSelectPack(pack)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                currentPackId === pack.id
                  ? 'bg-blue-600/20 border-2 border-blue-500'
                  : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                  {getPackIcon(pack)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white truncate">{pack.name}</h3>
                    {currentPackId === pack.id && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{pack.description}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-slate-500">
                      {pack.puzzleCount.toLocaleString()} puzzles
                    </span>
                    <span className={getDifficultyColor(pack.difficultyRange)}>
                      {getDifficultyLabel(pack.difficultyRange)}
                    </span>
                    {pack.categories.length > 0 && pack.categories[0] !== 'MIXED' && (
                      <span className="text-slate-500 truncate">
                        {pack.categories.length === 1 
                          ? pack.categories[0].replace(/_/g, ' ')
                          : `${pack.categories.length} categories`
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight size={20} className="text-slate-500 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>

        {filteredPacks.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            No packs match this filter.
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-4 border-t border-slate-700 text-center text-sm text-slate-500">
        Select a pack to start playing puzzles from that collection
      </div>
    </div>
  );
};
