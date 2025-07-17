import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ImagePath } from '../constants/ImagePath';
import HomeScreen from '../(tabs)/HomeScreen';
import CustormerScreen from '../(tabs)/CustormerScreen';
import ProfileScreen from '../(tabs)/ProfileScreen';
import { TokenStorage } from '../utils/apiUtils';
import AdminDashboard from '../screens/adminScreens/AdminDashboard';
import Projects from '../screens/adminScreens/Projects';
import TrackingScreen from '../screens/adminScreens/TrackingScreen';

const Tab = createBottomTabNavigator();

// Skeleton loading component
const LoadingSkeleton = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.skeletonBox} />
    <View style={styles.skeletonBox} />
    <View style={styles.skeletonBox} />
  </View>
);

// Icon maps per role
const adminIconMap = {
  // Dashboard: ImagePath.analytic,
  Tracking: ImagePath.pin,
  Projects: ImagePath.location2,
  Account: ImagePath.profile,
};

const managerIconMap = {
  // Home: ImagePath.home,
  Map: ImagePath.location2,
  Profile: ImagePath.profile,
};

const viewerIconMap = {
  Home: ImagePath.home,
  Account: ImagePath.profile,
};

export default function BottomTabNavigator() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await TokenStorage.getUserData();
        setUserData(user);
        console.log('User data:', user);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const screenOptions =
    (iconMap: any) =>
      ({ route }: { route: any }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }: { focused: boolean }) => (
          <Image
            source={iconMap[route.name]}
            resizeMode="contain"
            style={{
              width: 24,
              height: 24,
              tintColor: focused ? '#B68AD4' : '#313131',
            }}
          />
        ),
        tabBarStyle: {
          height: 75,
          paddingTop: 5,
          paddingBottom: 10,
          backgroundColor: '#fff',
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          paddingTop: 3,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarActiveTintColor: '#B68AD4',
        tabBarInactiveTintColor: '#313131',
      });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const role = userData?.role;
  console.log(role)
  let iconMap = {};
  let tabScreens;

  if (role === 'admin') {
    iconMap = adminIconMap;
    tabScreens = (
      <>
        {/* <Tab.Screen name="Dashboard" component={AdminDashboard} /> */}
        <Tab.Screen name="Tracking" component={TrackingScreen} />
        <Tab.Screen name="Projects" component={Projects} />
        <Tab.Screen name="Account" component={ProfileScreen} />
      </>
    );
  } else if (role === 'manager') {
    iconMap = managerIconMap;
    tabScreens = (
      <>
        {/* <Tab.Screen name="Dashboard" component={AdminDashboard} /> */}
        <Tab.Screen name="Tracking" component={TrackingScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </>
    );
  } else {
    iconMap = viewerIconMap;
    tabScreens = (
      <>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Account" component={ProfileScreen} />
      </>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={screenOptions(iconMap)}
    >
      {tabScreens}
    </Tab.Navigator>
  );
}

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  skeletonBox: {
    width: 200,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginVertical: 10,
    opacity: 0.6,
  },
});
