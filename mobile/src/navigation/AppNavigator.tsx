import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useAppStore } from '../store/useAppStore';
import { COLORS } from '../utils/theme';

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
import AddressScreen from '../screens/main/AddressScreen';
import ServiceBookingScreen from '../screens/main/ServiceBookingScreen';
import SearchScreen from '../screens/main/SearchScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import DealerPendingScreen from '../screens/dealer/DealerPendingScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  DealerPending: undefined;
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
        headerStyle: { backgroundColor: COLORS.primaryDark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
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
        headerStyle: { backgroundColor: COLORS.primaryDark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <ProfileStack.Screen name="Address" component={AddressScreen} options={{ title: 'Saved Addresses' }} />
      <ProfileStack.Screen name="AddAddress" component={AddressScreen} options={{ title: 'Add Address' }} />
      <ProfileStack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'My Orders' }} />
      <ProfileStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
    </ProfileStack.Navigator>
  );
}

function MainTabNavigator() {
  const { cart, unreadCount } = useAppStore();

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
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Search', headerShown: false }} />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarBadge: cart.totalItems > 0 ? cart.totalItems : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.accent },
          headerShown: true,
          headerTitle: 'My Cart',
          headerStyle: { backgroundColor: COLORS.primaryDark },
          headerTintColor: '#fff',
        }}
      />
      <Tab.Screen name="OrdersTab" component={OrderHistoryScreen} options={{ title: 'Orders', headerShown: true, headerTitle: 'My Orders', headerStyle: { backgroundColor: COLORS.primaryDark }, headerTintColor: '#fff' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated, isDealer, isDealerApproved, initAuth } = useAppStore();

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

  // Dealer awaiting approval
  const showDealerPending = isAuthenticated && isDealer && !isDealerApproved;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : showDealerPending ? (
          <Stack.Screen name="DealerPending" component={DealerPendingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
