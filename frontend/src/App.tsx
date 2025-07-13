import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator  } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AuthNavigator from './navigation/AuthNavigator';
import MainNavigator from './navigation/MainNavigator';
import { useAuthStore } from './store/authStore';
import './i18n';

const Stack = createNativeStackNavigator();

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
              <Stack.Screen name="Main" component={MainNavigator} />
            ) : (
              <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;