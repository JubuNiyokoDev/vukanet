import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LanguageButton from './LanguageButton';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNotifications?: boolean;
  showSettings?: boolean;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showNotifications = true,
  showSettings = false,
  onNotificationPress,
  onSettingsPress,
}) => {
  const notificationScale = useSharedValue(1);
  const settingsScale = useSharedValue(1);

  const createPressHandlers = (scale: Animated.SharedValue<number>) => ({
    onPressIn: () => {
      scale.value = withSpring(0.9);
    },
    onPressOut: () => {
      scale.value = withSpring(1);
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.actionsContainer}>
        <LanguageButton />
        {showNotifications && (
          <Animated.View
            style={useAnimatedStyle(() => ({
              transform: [{scale: notificationScale.value}],
            }))}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onNotificationPress}
              {...createPressHandlers(notificationScale)}>
              <Icon name="notifications" size={20} color="#667eea" />
            </TouchableOpacity>
          </Animated.View>
        )}
        {showSettings && (
          <Animated.View
            style={useAnimatedStyle(() => ({
              transform: [{scale: settingsScale.value}],
            }))}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSettingsPress}
              {...createPressHandlers(settingsScale)}>
              <Icon name="settings" size={20} color="#667eea" />
            </TouchableOpacity>
          </Animated.View>
        )}
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

export default Header;