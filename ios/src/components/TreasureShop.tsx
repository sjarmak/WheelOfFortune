/**
 * Treasure Shop Component
 *
 * Modal where kids can spend their Kid Bank money on items.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ShoppingBag, Music, Palette, Shirt } from 'lucide-react-native';
import { Modal } from './Modal';
import {
  ShopItem,
  INSTRUMENTS,
  WHEEL_THEMES,
  VANNA_DRESSES,
  VANNA_HAIR,
} from '../engine/shopTypes';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

interface TreasureShopProps {
  balance: number;
  ownedItems: string[];
  onBuy: (itemId: string) => void;
  visible: boolean;
  onClose: () => void;
}

type CategoryTab = 'instruments' | 'wheel' | 'dress' | 'hair';

interface CategoryConfig {
  label: string;
  icon: typeof Music;
  items: ShopItem[];
  gradientColors: [string, string];
}

const CATEGORY_CONFIG: Record<CategoryTab, CategoryConfig> = {
  instruments: {
    label: 'Music',
    icon: Music,
    items: INSTRUMENTS,
    gradientColors: [colors.purple[500], colors.pink[500]],
  },
  wheel: {
    label: 'Wheel',
    icon: Palette,
    items: WHEEL_THEMES,
    gradientColors: [colors.blue[500], colors.blue[400]],
  },
  dress: {
    label: 'Dress',
    icon: Shirt,
    items: VANNA_DRESSES,
    gradientColors: [colors.pink[500], colors.red[500]],
  },
  hair: {
    label: 'Hair',
    icon: Palette,
    items: VANNA_HAIR,
    gradientColors: [colors.yellow[400], colors.orange[500]],
  },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function TreasureShop({
  balance,
  ownedItems,
  onBuy,
  visible,
  onClose,
}: TreasureShopProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CategoryTab>('instruments');

  const currentItems = CATEGORY_CONFIG[activeTab].items;

  const handleBuy = (itemId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onBuy(itemId);
  };

  return (
    <Modal visible={visible} onClose={onClose} title="">
      {/* Custom header with shop icon */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShoppingBag size={32} color={colors.yellow[400]} />
          <Text style={styles.headerTitle}>Shop</Text>
        </View>
      </View>

      {/* Balance display */}
      <LinearGradient
        colors={[colors.green[500], colors.green[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.balanceContainer}
      >
        <Text style={styles.balanceLabel}>Your Money:</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
      </LinearGradient>

      {/* Category tabs */}
      <View style={styles.tabContainer}>
        {(Object.keys(CATEGORY_CONFIG) as CategoryTab[]).map((tab) => {
          const config = CATEGORY_CONFIG[tab];
          const IconComponent = config.icon;
          const isActive = activeTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tab}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={config.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabGradient}
                >
                  <IconComponent size={20} color={colors.white} />
                  <Text style={styles.tabLabelActive}>{config.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <IconComponent size={20} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.tabLabelInactive}>{config.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Items grid */}
      <ScrollView
        style={styles.itemsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemsGrid}>
          {currentItems.map((item) => {
            const owned = ownedItems.includes(item.id);
            const canAfford = balance >= item.price;

            return (
              <View
                key={item.id}
                style={[styles.itemCard, owned && styles.itemCardOwned]}
              >
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>

                {owned ? (
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedText}>Owned!</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleBuy(item.id)}
                    disabled={!canAfford}
                    activeOpacity={0.8}
                  >
                    {canAfford ? (
                      <LinearGradient
                        colors={[colors.yellow[400], colors.orange[500]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buyButton}
                      >
                        <Text style={styles.buyButtonText}>
                          {formatCurrency(item.price)}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.buyButtonDisabled}>
                        <Text style={styles.buyButtonDisabledText}>
                          {formatCurrency(item.price)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.helpText}>Earn more stars to get more money!</Text>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.sizes.sm,
  },
  balanceAmount: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  tab: {
    flex: 1,
  },
  tabGradient: {
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[1],
  },
  tabInactive: {
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.slate[700],
    gap: spacing[1],
  },
  tabLabelActive: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
  tabLabelInactive: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  itemsContainer: {
    flex: 1,
    maxHeight: 300,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  itemCard: {
    width: '47%',
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
  },
  itemCardOwned: {
    borderWidth: 2,
    borderColor: colors.green[500],
  },
  itemIcon: {
    fontSize: 36,
    marginBottom: spacing[2],
  },
  itemName: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  itemDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  ownedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  ownedText: {
    color: colors.green[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  buyButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.xl,
  },
  buyButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  buyButtonDisabled: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.slate[600],
  },
  buyButtonDisabledText: {
    color: colors.slate[400],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  helpText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: typography.sizes.xs,
    marginTop: spacing[4],
  },
});
