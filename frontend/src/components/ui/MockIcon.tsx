import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MockIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const MockIcon: React.FC<MockIconProps> = ({ 
  name, 
  size = 24, 
  color = '#000', 
  style 
}) => {
  // Mapping des icônes les plus courantes
  const iconMap: { [key: string]: string } = {
    'dashboard': '📊',
    'inventory': '📦',
    'shopping-cart': '🛒',
    'person': '👤',
    'flash-on': '⚡',
    'notifications': '🔔',
    'language': '🌐',
    'settings': '⚙️',
    'search': '🔍',
    'add': '➕',
    'warning': '⚠️',
    'attach-money': '💰',
    'trending-up': '📈',
    'check': '✓',
    'close': '✕',
    'chevron-right': '›',
    'email': '📧',
    'lock': '🔒',
    'visibility': '👁️',
    'visibility-off': '🙈',
    'arrow-forward': '→',
    'logout': '🚪',
    'help': '❓',
    'fingerprint': '👆',
    'dark-mode': '🌙',
    'light-mode': '☀️',
    'store': '🏪',
    'verified': '✅',
    'event': '📅',
    'smartphone': '📱',
    'credit-card': '💳',
    'delete': '🗑️',
    'remove': '➖',
    'check-circle': '✅',
  };

  const emoji = iconMap[name] || '●';

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Text style={[styles.icon, { fontSize: size * 0.8, color }]}>
        {emoji}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});

export default MockIcon;