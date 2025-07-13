import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useSettingsStore} from '../../store/settingsStore';

const languages = [
  {code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français'},
  {code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English'},
  {code: 'rn', name: 'Kirundi', flag: '🇧🇮', nativeName: 'Kirundi'},
  {code: 'sw', name: 'Kiswahili', flag: '🇹🇿', nativeName: 'Kiswahili'},
];

const LanguageButton: React.FC = () => {
  const {i18n} = useTranslation();
  const {setLanguage} = useSettingsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const scale = useSharedValue(1);
  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);

  const changeLanguage = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('userLanguage', languageCode);
      setLanguage(languageCode);
      closeModal();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const openModal = () => {
    setModalVisible(true);
    modalOpacity.value = withTiming(1, {duration: 300});
    modalScale.value = withSpring(1, {damping: 15, stiffness: 100});
  };

  const closeModal = () => {
    modalOpacity.value = withTiming(0, {duration: 200});
    modalScale.value = withTiming(0.8, {duration: 200});
    setTimeout(() => setModalVisible(false), 200);
  };

  const onPressIn = () => {
    scale.value = withSpring(0.95);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  const currentLanguage =
    languages.find(lang => lang.code === i18n.language) || languages[0];

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{scale: modalScale.value}],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  return (
    <>
      <Animated.View style={buttonAnimatedStyle}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={openModal}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.8}>
          <Icon name="language" size={18} color="#667eea" />
          <Text style={styles.languageFlag}>{currentLanguage.flag}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <Animated.View style={[styles.modalOverlay, overlayAnimatedStyle]}>
          <Pressable style={styles.modalPressable} onPress={closeModal}>
            <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
              <Pressable>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Icon name="language" size={24} color="#667eea" />
                    <Text style={styles.modalTitle}>Choisir la langue</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeModal}>
                    <Icon name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.languageList}>
                  {languages.map((language, index) => (
                    <TouchableOpacity
                      key={language.code}
                      style={[
                        styles.languageItem,
                        i18n.language === language.code &&
                          styles.selectedLanguage,
                      ]}
                      onPress={() => changeLanguage(language.code)}>
                      <View style={styles.languageInfo}>
                        <Text style={styles.languageItemFlag}>
                          {language.flag}
                        </Text>
                        <View style={styles.languageTexts}>
                          <Text style={styles.languageName}>
                            {language.nativeName}
                          </Text>
                          <Text style={styles.languageSubname}>
                            {language.name}
                          </Text>
                        </View>
                      </View>
                      {i18n.language === language.code && (
                        <View style={styles.checkContainer}>
                          <Icon name="check-circle" size={20} color="#667eea" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  languageFlag: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFBFC',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageList: {
    padding: 16,
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  selectedLanguage: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  languageItemFlag: {
    fontSize: 24,
  },
  languageTexts: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  languageSubname: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  checkContainer: {
    marginLeft: 8,
  },
});

export default LanguageButton;