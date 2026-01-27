/**
 * Treasure Shop Component
 *
 * Modal where kids can spend their Kid Bank money on:
 * - Instruments (for Music Room)
 * - Wheel themes (change wheel colors)
 * - Vanna dress colors
 * - Vanna hair colors
 */

import React, { useState } from 'react';
import { X, ShoppingBag, Music, Palette, Shirt } from 'lucide-react';
import {
  ShopItem,
  INSTRUMENTS,
  WHEEL_THEMES,
  VANNA_DRESSES,
  VANNA_HAIR,
} from '../engine/shopTypes';

interface TreasureShopProps {
  balance: number;
  ownedItems: string[];
  onBuy: (itemId: string) => void;
  onClose: () => void;
}

type CategoryTab = 'instruments' | 'wheel' | 'dress' | 'hair';

const CATEGORY_CONFIG: Record<CategoryTab, {
  label: string;
  icon: React.ReactNode;
  items: ShopItem[];
  color: string;
}> = {
  instruments: {
    label: 'Music',
    icon: <Music className="w-5 h-5" />,
    items: INSTRUMENTS,
    color: 'from-purple-500 to-pink-500',
  },
  wheel: {
    label: 'Wheel',
    icon: <Palette className="w-5 h-5" />,
    items: WHEEL_THEMES,
    color: 'from-blue-500 to-cyan-500',
  },
  dress: {
    label: 'Dress',
    icon: <Shirt className="w-5 h-5" />,
    items: VANNA_DRESSES,
    color: 'from-pink-500 to-red-500',
  },
  hair: {
    label: 'Hair',
    icon: <span className="text-lg">💇</span>,
    items: VANNA_HAIR,
    color: 'from-yellow-500 to-orange-500',
  },
};

export const TreasureShop: React.FC<TreasureShopProps> = ({
  balance,
  ownedItems,
  onBuy,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('instruments');

  const currentItems = CATEGORY_CONFIG[activeTab].items;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Shop</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Balance display */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-white/80 text-sm">Your Money:</span>
          <span className="text-2xl font-bold text-white">{formatCurrency(balance)}</span>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-4">
          {(Object.keys(CATEGORY_CONFIG) as CategoryTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-xl
                transition-all duration-200
                ${activeTab === tab
                  ? `bg-gradient-to-r ${CATEGORY_CONFIG[tab].color} text-white`
                  : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                }
              `}
            >
              {CATEGORY_CONFIG[tab].icon}
              <span className="text-xs font-medium">{CATEGORY_CONFIG[tab].label}</span>
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {currentItems.map((item) => {
              const owned = ownedItems.includes(item.id);
              const canAfford = balance >= item.price;

              return (
                <div
                  key={item.id}
                  className={`
                    bg-slate-700/50 rounded-xl p-4 flex flex-col items-center
                    ${owned ? 'ring-2 ring-green-500' : ''}
                  `}
                >
                  {/* Item icon */}
                  <span className="text-4xl mb-2">{item.icon}</span>

                  {/* Item name */}
                  <h3 className="text-white font-bold text-center text-sm mb-1">
                    {item.name}
                  </h3>

                  {/* Item description */}
                  <p className="text-white/60 text-xs text-center mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Price / Buy button */}
                  {owned ? (
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                      Owned!
                    </span>
                  ) : (
                    <button
                      onClick={() => onBuy(item.id)}
                      disabled={!canAfford}
                      className={`
                        px-4 py-2 rounded-xl font-bold text-sm transition-all
                        ${canAfford
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:scale-105 active:scale-95'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {formatCurrency(item.price)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-white/40 text-xs mt-4">
          Earn more stars to get more money!
        </p>
      </div>
    </div>
  );
};
