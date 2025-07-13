import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';

import DashboardScreen from '../screens/main/DashboardScreen';
import ProductsScreen from '../screens/main/ProductsScreen';
import SalesScreen from '../screens/main/SalesScreen';
import QuickSaleScreen from '../screens/main/QuickSaleScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainNavigator: React.FC = () => {
  const {t} = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingTop: 5,
          paddingBottom: 8,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -2},
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarIcon: ({focused, color, size}) => {
          let iconName = '';

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'QuickSale':
              iconName = 'flash-on';
              break;
            case 'Products':
              iconName = 'inventory';
              break;
            case 'Sales':
              iconName = 'shopping-cart';
              break;
            case 'Profile':
              iconName = 'person';
              break;
          }

          return <Icon name={iconName} size={20} color={color} />;
        },
      })}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t('navigation.dashboard'),
        }}
      />
      <Tab.Screen
        name="QuickSale"
        component={QuickSaleScreen}
        options={{
          title: 'Vente',
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: t('navigation.products'),
        }}
      />
      <Tab.Screen
        name="Sales"
        component={SalesScreen}
        options={{
          title: t('navigation.sales'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('navigation.profile'),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;