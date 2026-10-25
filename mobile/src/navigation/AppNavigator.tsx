import React, { useEffect } from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useAppStore } from '../store/useAppStore';
import { COLORS } from '../utils/theme';
import { useAppTheme } from '../context/ThemeContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DealerRegisterScreen from '../screens/auth/DealerRegisterScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import ProductListScreen from '../screens/main/ProductListScreen';
import ProductDetailScreen from '../screens/main/ProductDetailScreen';
import CartScreen from '../screens/main/CartScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import OrderSuccessScreen from '../screens/main/OrderSuccessScreen';
import OrderHistoryScreen from '../screens/main/OrderHistoryScreen';
import OrderDetailScreen from '../screens/main/OrderDetailScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import AddressScreen from '../screens/main/AddressScreen';
import ServiceBookingScreen from '../screens/main/ServiceBookingScreen';
import SearchScreen from '../screens/main/SearchScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  DealerRegister: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ProductList: { category?: string; title?: string; featured?: boolean; popular?: boolean };
  ProductDetail: { productId: string };
  Checkout: undefined;
  OrderSuccess: { orderId: string };
  ServiceBooking: undefined;
  Notifications: undefined;
  AddAddress: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Address: undefined;
  AddAddress: undefined;
  OrderHistory: undefined;
  OrderDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="DealerRegister" component={DealerRegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontFamily: 'Georgia', fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="ProductList" component={ProductListScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerTransparent: true, title: '' }} />
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <HomeStack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="ServiceBooking" component={ServiceBookingScreen} options={{ title: 'Book Service' }} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <HomeStack.Screen name="AddAddress" component={AddressScreen} options={{ title: 'Add Address' }} />
    </HomeStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontFamily: 'Georgia', fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <ProfileStack.Screen name="Address" component={AddressScreen} options={{ title: 'Saved Addresses' }} />
      <ProfileStack.Screen name="AddAddress" component={AddressScreen} options={{ title: 'Add Address' }} />
      <ProfileStack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'My Orders' }} />
      <ProfileStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
    </ProfileStack.Navigator>
  );
}

function MainTabNavigator() {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  const { cart, unreadCount } = useAppStore();
  const insets = useSafeAreaInsets();
  const floatingTabBarStyle = {
    position: 'absolute' as const,
    left: 22,
    right: 22,
    bottom: Math.max(insets.bottom, 12),
    height: 62,
    paddingTop: 7,
    paddingBottom: 7,
    backgroundColor: COLORS.primaryDark,
    borderTopWidth: 0,
    borderRadius: 34,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            HomeTab: focused ? 'home' : 'home-outline',
            SearchTab: focused ? 'search' : 'search-outline',
            CartTab: focused ? 'cart' : 'cart-outline',
            OrdersTab: focused ? 'receipt' : 'receipt-outline',
            ProfileTab: focused ? 'person' : 'person-outline',
          };
          return (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons name={icons[route.name] as any} size={20} color={focused ? COLORS.primary : '#F4F4F6'} />
            </View>
          );
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#F4F4F6',
        tabBarStyle: floatingTabBarStyle,
        tabBarItemStyle: { height: 48 },
        tabBarHideOnKeyboard: true,
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={({ route }) => ({
        title: 'Home',
        tabBarStyle: (getFocusedRouteNameFromRoute(route) ?? 'Home') === 'Home' ? floatingTabBarStyle : { display: 'none' },
      })} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Search', headerShown: false }} />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarBadge: cart.totalItems > 0 ? cart.totalItems : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.accent, color: COLORS.text },
          headerShown: true,
          headerTitle: 'My Cart',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
        }}
      />
      <Tab.Screen name="OrdersTab" component={OrderHistoryScreen} options={{ title: 'Orders', headerShown: true, headerTitle: 'My Orders', headerStyle: { backgroundColor: COLORS.background }, headerTintColor: COLORS.text, headerShadowVisible: false, headerTitleStyle: { fontFamily: 'Georgia', fontWeight: '700' } }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={({ route }) => ({
        title: 'Profile',
        tabBarStyle: (getFocusedRouteNameFromRoute(route) ?? 'Profile') === 'Profile' ? floatingTabBarStyle : { display: 'none' },
      })} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  const { isLoading, isAuthenticated, initAuth } = useAppStore();

  useEffect(() => {
    const unsub = initAuth();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={{ ...(isDark ? DarkTheme : DefaultTheme), colors: { ...(isDark ? DarkTheme.colors : DefaultTheme.colors), primary: COLORS.primary, background: COLORS.background, card: COLORS.surface, text: COLORS.text, border: COLORS.border, notification: COLORS.accent } }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function createStyles() {
  return StyleSheet.create({
  tabIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { backgroundColor: '#fff' },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  });
}

