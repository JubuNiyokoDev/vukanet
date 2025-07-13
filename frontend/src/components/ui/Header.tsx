import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.actionsContainer}>
        {showNotifications && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onNotificationPress}>
            <Icon name="notifications" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
        {showSettings && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onSettingsPress}>
            <Icon name="settings" size={24} color="#6B7280" />
          </TouchableOpacity>
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
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
});

export default Header;