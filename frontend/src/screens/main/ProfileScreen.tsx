import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LanguageSelector from '../../components/ui/LanguageSelector';
import {useAuthStore} from '../../store/authStore';
import {useSettingsStore} from '../../store/settingsStore';

const ProfileScreen: React.FC = () => {
  const {t} = useTranslation();
  const {user, logout} = useAuthStore();
  const {
    darkMode,
    notifications,
    biometricAuth,
    toggleDarkMode,
    toggleNotifications,
    toggleBiometricAuth,
  } = useSettingsStore();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      {text: 'Annuler', style: 'cancel'},
      {text: 'Déconnexion', onPress: logout, style: 'destructive'},
    ]);
  };

  const SettingItem = ({
    iconName,
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = true,
  }: {
    iconName: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Icon name={iconName} size={20} color="#667eea" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && !rightElement && (
          <Icon name="chevron-right" size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t('profile.title')}
        subtitle={t('profile.settingsAndInfo')}
        showNotifications={false}
        showSettings={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Icon name="person" size={32} color="#2563EB" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.userRole}>
                <Icon name="verified" size={16} color="#10B981" />
                <Text style={styles.userRoleText}>
                  {user?.role === 'admin'
                    ? t('profile.administrator')
                    : t('profile.seller')}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        <Card style={styles.storeCard}>
          <View style={styles.storeInfo}>
            <View style={styles.storeIcon}>
              <Icon name="store" size={24} color="#2563EB" />
            </View>
            <View style={styles.storeDetails}>
              <Text style={styles.storeTitle}>{t('profile.store')}</Text>
              <Text style={styles.storeName}>{user?.storeName}</Text>
              <Text style={styles.storeId}>ID: {user?.storeId}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.languageCard}>
          <Text style={styles.languageTitle}>
            {t('languages.selectLanguage')}
          </Text>
          <LanguageSelector />
        </Card>

        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>{t('profile.settings')}</Text>

          <Card style={styles.menuCard}>
            <SettingItem
              iconName={darkMode ? 'dark-mode' : 'light-mode'}
              title="Mode sombre"
              subtitle="Activer le thème sombre"
              rightElement={
                <TouchableOpacity
                  style={[styles.switch, darkMode && styles.switchActive]}
                  onPress={toggleDarkMode}>
                  <View
                    style={[
                      styles.switchThumb,
                      darkMode && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              }
              showChevron={false}
            />

            <SettingItem
              iconName="notifications"
              title={t('profile.notifications')}
              subtitle="Gérer les notifications"
              rightElement={
                <TouchableOpacity
                  style={[styles.switch, notifications && styles.switchActive]}
                  onPress={toggleNotifications}>
                  <View
                    style={[
                      styles.switchThumb,
                      notifications && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              }
              showChevron={false}
            />

            <SettingItem
              iconName="fingerprint"
              title="Authentification biométrique"
              subtitle="Utiliser l'empreinte ou Face ID"
              rightElement={
                <TouchableOpacity
                  style={[
                    styles.switch,
                    biometricAuth && styles.switchActive,
                  ]}
                  onPress={toggleBiometricAuth}>
                  <View
                    style={[
                      styles.switchThumb,
                      biometricAuth && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              }
              showChevron={false}
            />

            <SettingItem
              iconName="help"
              title={t('profile.helpSupport')}
              subtitle="FAQ et guides d'utilisation"
              onPress={() =>
                Alert.alert('Aide', "Centre d'aide bientôt disponible")
              }
            />
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>{t('profile.account')}</Text>

          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="logout" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>{t('profile.logout')}</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('profile.appName')}</Text>
          <Text style={styles.infoText}>{t('profile.appDescription')}</Text>
          <Text style={styles.infoVersion}>{t('profile.version')}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  userRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  userRoleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  storeCard: {
    marginBottom: 20,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeDetails: {
    flex: 1,
  },
  storeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  storeId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  languageCard: {
    marginBottom: 20,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  menuSection: {
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  menuCard: {
    paddingVertical: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#667eea',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{translateX: 20}],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  infoCard: {
    marginBottom: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  infoVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
});

export default ProfileScreen;