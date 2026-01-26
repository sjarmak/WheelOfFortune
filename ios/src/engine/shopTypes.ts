// Shop items, achievements, and treasure box types

export type ShopCategory = 'instrument' | 'wheel_theme' | 'vanna_dress' | 'vanna_hair';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShopCategory;
  icon: string;
  // For instruments - frequency data for Web Audio API
  frequencies?: number[];
  // For wheel themes - array of 16 colors for segments
  wheelColors?: string[];
  // For Vanna customizations - hex color for inline styles
  hexColor?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  starsRequired: number;
  rewardItemIds: string[];
  icon: string;
}

export interface TreasureBoxState {
  ownedItems: string[];
  equippedWheelTheme: string | null;
  equippedDressColor: string | null;
  equippedHairColor: string | null;
  unlockedAchievements: string[];
  kidBankSpent: number; // Track total spent for balance calculation
}

export const INITIAL_TREASURE_STATE: TreasureBoxState = {
  ownedItems: [],
  equippedWheelTheme: null,
  equippedDressColor: null,
  equippedHairColor: null,
  unlockedAchievements: [],
  kidBankSpent: 0,
};

// ============================================
// INSTRUMENTS - Play different musical sounds
// ============================================

export const INSTRUMENTS: ShopItem[] = [
  {
    id: 'piano',
    name: 'Piano',
    description: 'Play beautiful piano keys!',
    price: 500,
    category: 'instrument',
    icon: '🎹',
    frequencies: [262, 294, 330, 349, 392, 440, 494, 523], // C4 to C5
  },
  {
    id: 'xylophone',
    name: 'Xylophone',
    description: 'Tap colorful bars for fun sounds!',
    price: 800,
    category: 'instrument',
    icon: '🎵',
    frequencies: [523, 587, 659, 698, 784, 880, 988, 1047], // C5 to C6
  },
  {
    id: 'drums',
    name: 'Drum Set',
    description: 'Bang the drums loud!',
    price: 1200,
    category: 'instrument',
    icon: '🥁',
    frequencies: [80, 120, 200, 350], // Low bass, tom, snare, hi-hat approximations
  },
  {
    id: 'guitar',
    name: 'Guitar',
    description: 'Strum sweet guitar strings!',
    price: 1500,
    category: 'instrument',
    icon: '🎸',
    frequencies: [330, 247, 196, 147, 110, 82], // E4 to E2 (guitar strings)
  },
  {
    id: 'trumpet',
    name: 'Trumpet',
    description: 'Blow a mighty brass sound!',
    price: 1800,
    category: 'instrument',
    icon: '🎺',
    frequencies: [466, 523, 587, 659, 698], // Bb4 to F5
  },
  {
    id: 'triangle',
    name: 'Triangle',
    description: 'Ding! A sparkly little sound!',
    price: 600,
    category: 'instrument',
    icon: '🔺',
    frequencies: [1500, 2000, 2500], // High metallic tones
  },
];

// ============================================
// WHEEL THEMES - Change wheel segment colors
// ============================================

export const WHEEL_THEMES: ShopItem[] = [
  {
    id: 'rainbow',
    name: 'Rainbow Wheel',
    description: 'All the colors of the rainbow!',
    price: 1500,
    category: 'wheel_theme',
    icon: '🌈',
    wheelColors: [
      '#FF0000', '#FF4500', '#FFA500', '#FFD700',
      '#FFFF00', '#9ACD32', '#32CD32', '#00FF00',
      '#00CED1', '#00BFFF', '#0000FF', '#8A2BE2',
      '#9400D3', '#FF00FF', '#FF1493', '#FF69B4',
    ],
  },
  {
    id: 'ocean',
    name: 'Ocean Wheel',
    description: 'Cool blues like the sea!',
    price: 2000,
    category: 'wheel_theme',
    icon: '🌊',
    wheelColors: [
      '#006994', '#40E0D0', '#00CED1', '#20B2AA',
      '#5F9EA0', '#4682B4', '#6495ED', '#00BFFF',
      '#87CEEB', '#ADD8E6', '#B0E0E6', '#AFEEEE',
      '#48D1CC', '#00FA9A', '#7FFFD4', '#66CDAA',
    ],
  },
  {
    id: 'sunset',
    name: 'Sunset Wheel',
    description: 'Warm oranges and pinks!',
    price: 2000,
    category: 'wheel_theme',
    icon: '🌅',
    wheelColors: [
      '#FF4500', '#FF6347', '#FF7F50', '#FFA07A',
      '#FFB347', '#FFCC00', '#FFD700', '#FFA500',
      '#FF8C00', '#FF69B4', '#FF1493', '#DB7093',
      '#C71585', '#FF6B6B', '#E74C3C', '#DC143C',
    ],
  },
  {
    id: 'galaxy',
    name: 'Galaxy Wheel',
    description: 'Purple and blue like outer space!',
    price: 2500,
    category: 'wheel_theme',
    icon: '🌌',
    wheelColors: [
      '#4B0082', '#6A0DAD', '#8B008B', '#9400D3',
      '#9932CC', '#BA55D3', '#8A2BE2', '#7B68EE',
      '#6A5ACD', '#483D8B', '#191970', '#000080',
      '#00008B', '#0000CD', '#4169E1', '#1E90FF',
    ],
  },
  {
    id: 'candy',
    name: 'Candy Wheel',
    description: 'Sweet pastel colors!',
    price: 1800,
    category: 'wheel_theme',
    icon: '🍬',
    wheelColors: [
      '#FFB6C1', '#FFC0CB', '#FF69B4', '#FFB347',
      '#FFDAB9', '#FFFACD', '#E0FFFF', '#B0E0E6',
      '#DDA0DD', '#E6E6FA', '#D8BFD8', '#FFEFD5',
      '#FFF0F5', '#F0FFF0', '#F5FFFA', '#FFF5EE',
    ],
  },
];

// ============================================
// VANNA DRESS COLORS
// ============================================

export const VANNA_DRESSES: ShopItem[] = [
  {
    id: 'dress_blue',
    name: 'Blue Dress',
    description: 'A beautiful blue dress for Vanna!',
    price: 1000,
    category: 'vanna_dress',
    icon: '👗',
    hexColor: '#2563EB', // blue-600
  },
  {
    id: 'dress_purple',
    name: 'Purple Dress',
    description: 'A pretty purple dress for Vanna!',
    price: 1200,
    category: 'vanna_dress',
    icon: '👗',
    hexColor: '#9333EA', // purple-600
  },
  {
    id: 'dress_green',
    name: 'Green Dress',
    description: 'A lovely green dress for Vanna!',
    price: 1200,
    category: 'vanna_dress',
    icon: '👗',
    hexColor: '#16A34A', // green-600
  },
  {
    id: 'dress_pink',
    name: 'Pink Dress',
    description: 'A fabulous pink dress for Vanna!',
    price: 1500,
    category: 'vanna_dress',
    icon: '👗',
    hexColor: '#EC4899', // pink-500
  },
  {
    id: 'dress_gold',
    name: 'Gold Dress',
    description: 'A shiny gold dress for Vanna!',
    price: 2500,
    category: 'vanna_dress',
    icon: '👗',
    hexColor: '#EAB308', // yellow-500 (gold)
  },
];

// ============================================
// VANNA HAIR COLORS
// ============================================

export const VANNA_HAIR: ShopItem[] = [
  {
    id: 'hair_brown',
    name: 'Brown Hair',
    description: 'Pretty brown hair for Vanna!',
    price: 1000,
    category: 'vanna_hair',
    icon: '💇',
    hexColor: '#B45309', // amber-700
  },
  {
    id: 'hair_black',
    name: 'Black Hair',
    description: 'Sleek black hair for Vanna!',
    price: 1000,
    category: 'vanna_hair',
    icon: '💇',
    hexColor: '#1F2937', // gray-800 (darker for visibility)
  },
  {
    id: 'hair_red',
    name: 'Red Hair',
    description: 'Fiery red hair for Vanna!',
    price: 1500,
    category: 'vanna_hair',
    icon: '💇',
    hexColor: '#DC2626', // red-600
  },
  {
    id: 'hair_pink',
    name: 'Pink Hair',
    description: 'Fun pink hair for Vanna!',
    price: 2000,
    category: 'vanna_hair',
    icon: '💇',
    hexColor: '#F472B6', // pink-400
  },
  {
    id: 'hair_blue',
    name: 'Blue Hair',
    description: 'Cool blue hair for Vanna!',
    price: 2000,
    category: 'vanna_hair',
    icon: '💇',
    hexColor: '#60A5FA', // blue-400
  },
];

// ============================================
// ALL SHOP ITEMS combined
// ============================================

export const ALL_SHOP_ITEMS: ShopItem[] = [
  ...INSTRUMENTS,
  ...WHEEL_THEMES,
  ...VANNA_DRESSES,
  ...VANNA_HAIR,
];

export function getShopItem(id: string): ShopItem | undefined {
  return ALL_SHOP_ITEMS.find(item => item.id === id);
}

export function getItemsByCategory(category: ShopCategory): ShopItem[] {
  return ALL_SHOP_ITEMS.filter(item => item.category === category);
}

// ============================================
// ACHIEVEMENTS - Auto-unlock free rewards
// ============================================

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_ten',
    title: 'First Ten!',
    description: 'You earned 10 stars!',
    starsRequired: 10,
    rewardItemIds: ['piano'],
    icon: '🌟',
  },
  {
    id: 'star_collector',
    title: 'Star Collector',
    description: 'You earned 25 stars!',
    starsRequired: 25,
    rewardItemIds: ['rainbow'],
    icon: '✨',
  },
  {
    id: 'super_star',
    title: 'Super Star',
    description: 'You earned 50 stars!',
    starsRequired: 50,
    rewardItemIds: ['dress_blue'],
    icon: '⭐',
  },
  {
    id: 'star_champion',
    title: 'Star Champion',
    description: 'You earned 100 stars!',
    starsRequired: 100,
    rewardItemIds: ['hair_pink'],
    icon: '🏆',
  },
  {
    id: 'star_legend',
    title: 'Star Legend',
    description: 'You earned 200 stars!',
    starsRequired: 200,
    rewardItemIds: ['dress_gold', 'galaxy'],
    icon: '👑',
  },
];

export function getUnlockedAchievements(totalStars: number): Achievement[] {
  return ACHIEVEMENTS.filter(a => totalStars >= a.starsRequired);
}

export function getNewAchievements(
  totalStars: number,
  alreadyUnlocked: string[]
): Achievement[] {
  return ACHIEVEMENTS.filter(
    a => totalStars >= a.starsRequired && !alreadyUnlocked.includes(a.id)
  );
}
