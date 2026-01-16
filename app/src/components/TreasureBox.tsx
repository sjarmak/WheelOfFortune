/**
 * Treasure Box Component
 *
 * Shows all owned items organized by category
 * Allows equipping wheel themes and Vanna customizations
 */

import React, { useState } from 'react';
import { X, Package, Check, Music } from 'lucide-react';
import {
  ShopItem,
  ShopCategory,
  INSTRUMENTS,
  WHEEL_THEMES,
  VANNA_DRESSES,
  VANNA_HAIR,
} from '../engine/shopTypes';
import { TreasureBoxState } from '../engine/kidTypes';

interface TreasureBoxProps {
  treasure: TreasureBoxState;
  onEquip: (itemId: string, category: ShopCategory) => void;
  onUnequip: (category: ShopCategory) => void;
  onOpenMusicRoom: () => void;
  onClose: () => void;
}

type CategoryTab = 'instruments' | 'wheel' | 'dress' | 'hair';

const CATEGORY_MAP: Record<CategoryTab, {
  label: string;
  allItems: ShopItem[];
  equippedKey: keyof TreasureBoxState | null;
}> = {
  instruments: {
    label: 'Instruments',
    allItems: INSTRUMENTS,
    equippedKey: null, // Instruments don't get equipped
  },
  wheel: {
    label: 'Wheel Themes',
    allItems: WHEEL_THEMES,
    equippedKey: 'equippedWheelTheme',
  },
  dress: {
    label: 'Dresses',
    allItems: VANNA_DRESSES,
    equippedKey: 'equippedDressColor',
  },
  hair: {
    label: 'Hair Colors',
    allItems: VANNA_HAIR,
    equippedKey: 'equippedHairColor',
  },
};

export const TreasureBox: React.FC<TreasureBoxProps> = ({
  treasure,
  onEquip,
  onUnequip,
  onOpenMusicRoom,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('instruments');

  const config = CATEGORY_MAP[activeTab];
  const ownedInCategory = config.allItems.filter(item =>
    treasure.ownedItems.includes(item.id)
  );

  const getEquippedId = (): string | null => {
    if (!config.equippedKey) return null;
    return treasure[config.equippedKey] as string | null;
  };

  const equippedId = getEquippedId();

  const handleEquipToggle = (item: ShopItem) => {
    if (equippedId === item.id) {
      onUnequip(item.category);
    } else {
      onEquip(item.id, item.category);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">My Treasure Box</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Total items owned */}
        <div className="bg-amber-500/20 rounded-xl px-4 py-2 mb-4 text-center">
          <span className="text-amber-400 font-bold">
            {treasure.ownedItems.length} treasures collected!
          </span>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-4">
          {(Object.keys(CATEGORY_MAP) as CategoryTab[]).map((tab) => {
            const count = CATEGORY_MAP[tab].allItems.filter(item =>
              treasure.ownedItems.includes(item.id)
            ).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 py-2 px-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${activeTab === tab
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                    : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                  }
                `}
              >
                {CATEGORY_MAP[tab].label}
                {count > 0 && (
                  <span className="ml-1 text-xs opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto">
          {ownedInCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/40">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">
                No {config.label.toLowerCase()} yet!
                <br />
                <span className="text-sm">Visit the shop to buy some!</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {ownedInCategory.map((item) => {
                const isEquipped = equippedId === item.id;
                const canEquip = config.equippedKey !== null;

                return (
                  <div
                    key={item.id}
                    className={`
                      bg-slate-700/50 rounded-xl p-4 flex flex-col items-center
                      ${isEquipped ? 'ring-2 ring-green-500 bg-green-500/10' : ''}
                    `}
                  >
                    {/* Item icon */}
                    <span className="text-4xl mb-2">{item.icon}</span>

                    {/* Item name */}
                    <h3 className="text-white font-bold text-center text-sm mb-2">
                      {item.name}
                    </h3>

                    {/* Action button */}
                    {activeTab === 'instruments' ? (
                      <button
                        onClick={onOpenMusicRoom}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl
                          bg-gradient-to-r from-purple-500 to-pink-500
                          text-white text-sm font-bold hover:scale-105 active:scale-95
                          transition-transform"
                      >
                        <Music className="w-4 h-4" />
                        Play!
                      </button>
                    ) : canEquip && (
                      <button
                        onClick={() => handleEquipToggle(item)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-xl
                          text-sm font-bold transition-all
                          ${isEquipped
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-600 text-white/80 hover:bg-slate-500'
                          }
                        `}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-4 h-4" />
                            Wearing
                          </>
                        ) : (
                          'Wear It!'
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-center text-white/40 text-xs mt-4">
          {activeTab === 'instruments'
            ? 'Tap an instrument to go to the Music Room!'
            : "Tap 'Wear It!' to use your customizations!"}
        </p>
      </div>
    </div>
  );
};
