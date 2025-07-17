import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import { TokenStorage } from '../utils/apiUtils';

const userAvatar = require('../assets/images/icons/user.png'); // Replace with your default/avatar

const LoadingSkeleton = () => (
  <View style={styles.loadingContainer}>
    {[...Array(6)].map((_, i) => (
      <View key={i} style={[styles.skeletonRow, { width: `${90 - i * 7}%` }]} />
    ))}
    <ActivityIndicator size="large" color="#B68AD4" style={{ marginTop: 16 }} />
  </View>
);

const ProfileScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await TokenStorage.getUserData();
        setUserData(user);
        setGpsEnabled(user?.gpsEnabled || false);
      } catch (e) {
        console.error('Fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const toggleGPSEnabled = () => setGpsEnabled(prev => !prev);
  const handleLogout = () => {
    TokenStorage.clearAll()
    navigation.navigate("LoginScreen")
  };

  if (loading) return <LoadingSkeleton />;

  const {
    name, email, role, isActive, createdAt,
    streetAddress, landMark, city, state, country, pincode
  } = userData;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image source={userAvatar} style={styles.avatar} />
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Status / Info Cards */}
      <View style={styles.cardRow}>
        <View style={[styles.statCard, isActive === 'true' ? styles.active : styles.inactive]}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={styles.statValue}>{isActive === 'true' ? 'Active' : 'Inactive'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Role</Text>
          <Text style={styles.statValue}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
        </View>
      </View>

      {/* Address Card */}
      <View style={styles.addressCard}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.addressText}>{streetAddress}</Text>
        <Text style={styles.addressText}>{landMark}</Text>
        <Text style={styles.addressText}>
          {city}, {state}, {country} - {pincode}
        </Text>
      </View>

      {/* Joined On */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Joined On</Text>
        <Text style={styles.infoText}>{new Date(createdAt).toLocaleDateString()}</Text>
      </View>

      {/* Settings & Logout */}
      <TouchableOpacity style={styles.settingsButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.settingsText}>Open Settings ⚙️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Modal Settings */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable GPS</Text>
              <Switch
                value={gpsEnabled}
                onValueChange={toggleGPSEnabled}
                thumbColor={gpsEnabled ? '#B68AD4' : '#ccc'}
              />
            </View>
            {role === 'admin' && (
              <TouchableOpacity style={styles.adminButton}>
                <Text style={styles.adminText}>Manage Users (Admin)</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  skeletonRow: { height: 20, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 12 },

  header: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { borderRadius: 50, overflow: 'hidden', marginBottom: 12 },
  avatar: { width: 100, height: 100 },
  name: { fontSize: 22, fontWeight: '600', color: '#111' },
  email: { fontSize: 14, color: '#666' },

  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  active: { backgroundColor: '#E6F9E8' },
  inactive: { backgroundColor: '#FBEAEA' },
  statLabel: { fontSize: 12, color: '#888' },
  statValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },

  addressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  addressText: { fontSize: 14, color: '#444', marginBottom: 4 },

  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  infoText: { fontSize: 14, color: '#444' },

  settingsButton: {
    backgroundColor: '#B68AD4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsText: { color: '#fff', fontWeight: '600' },

  logoutButton: { backgroundColor: '#D9534F', padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  settingLabel: { fontSize: 16, color: '#333' },

  adminButton: { backgroundColor: '#B68AD4', padding: 12, borderRadius: 6, marginBottom: 12 },
  adminText: { color: '#fff', textAlign: 'center', fontWeight: '600' },

  closeButton: { padding: 12, alignItems: 'center' },
  closeText: { color: '#B68AD4', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
