import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, ActivityIndicator, TextInput, Image
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as ImagePicker from 'react-native-image-picker';
import { Fetch, Put, TokenStorage } from '../utils/apiUtils';
import { ImagePath } from '../constants/ImagePath';
import { Picker } from '@react-native-picker/picker';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  department: yup.string(),
  designation: yup.string(),
  manager: yup.string(),
  city: yup.string(),
  country: yup.string(),
});

const ProfileScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [managersList, setManagersList] = useState<any[]>([]);
  const [avatar, setAvatar] = useState<any>(null);

  const {
    control, handleSubmit, reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const user: any = await TokenStorage.getUserData();
        setUserData(user);
        if (user?.profilePic) {
          setAvatar({ uri: user.profilePic });
        }
        reset(user);

        const res: any = await Fetch('/api/auth/user?role=manager');
        const managers = res?.data?.users.filter((u: any) => u.role === "manager");
        setManagersList(managers);
      } catch (e) {
        console.error(e);
        Toast.show({ type: 'error', text1: 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const pickImage = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        const selected = response.assets[0];
        setAvatar({
          uri: selected.uri,
          type: selected.type,
          name: selected.fileName,
        });
      }
    });
  };

  const removeImage = () => {
    setAvatar(null);
  };

  const onSubmit = async (data: any) => {
    try {
      let employeeId = data.employeeId || `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = { ...data, employeeId };

      if (avatar && avatar.uri !== userData.profilePic) {
        payload.profilePic = avatar.uri;
      } else if (!avatar) {
        payload.profilePic = '';
      }

      const res: any = await Put(`/api/auth/user/${userData._id}`, payload);
      const updatedUser = res.data;
      console.log(res)
      setUserData(updatedUser);
      TokenStorage.setUserData(updatedUser);
      Toast.show({ type: 'success', text1: 'Profile updated' });
      setModalVisible(false);
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const handleLogout = () => {
    TokenStorage.clearAll();
    navigation.navigate('LoginScreen');
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#B68AD4" />
      </View>
    );
  }

  const renderField = (label: string, name: string, placeholder?: string) => (
    <View style={styles.field} key={name}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        name={name as any}
        control={control}
        defaultValue={userData?.[name] || ''}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder={placeholder || label}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors[name] && <Text style={styles.error}>{(errors as any)[name]?.message}</Text>}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image
          source={
            avatar?.uri
              ? { uri: avatar.uri }
              : userData?.profilePic
                ? { uri: userData.profilePic }
                : ImagePath.profile
          }
          style={styles.avatar}
        />
        <Text style={styles.name}>{userData?.name}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
        <Text style={styles.role}>{userData?.role}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Department: {userData?.department}</Text>
        <Text style={styles.infoText}>Designation: {userData?.designation}</Text>
        <Text style={styles.infoText}>Manager: {userData?.manager}</Text>
        <Text style={styles.infoText}>Employee ID: {userData?.employeeId}</Text>
        <Text style={styles.infoText}>City: {userData?.city}</Text>
        <Text style={styles.infoText}>Country: {userData?.country}</Text>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Profile</Text>

          <View style={styles.imagePicker}>
            {avatar?.uri || userData?.profilePic ? (
              <>
                <Image
                  source={{ uri: avatar?.uri || userData.profilePic }}
                  style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 10 }}
                />
                <TouchableOpacity onPress={pickImage}>
                  <Text style={styles.imagePickerText}>Change Image</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={removeImage}>
                  <Text style={[styles.imagePickerText, { color: 'red' }]}>Remove Image</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={pickImage}>
                <Text style={styles.imagePickerText}>Add Profile Image</Text>
              </TouchableOpacity>
            )}
          </View>

          {renderField('Name', 'name')}
          {renderField('Email', 'email')}
          {renderField('Department', 'department')}
          {renderField('Designation', 'designation')}

          <View style={styles.field}>
            <Text style={styles.label}>Manager</Text>
            <Controller
              name="manager"
              control={control}
              defaultValue={userData?.manager}
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={value}
                    onValueChange={(itemValue) => onChange(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a manager..." value="" />
                    {managersList.map((manager: any, index: number) => (
                      <Picker.Item key={index} label={manager?.name} value={manager?.id} />
                    ))}
                  </Picker>
                </View>
              )}
            />
          </View>

          {renderField('Employee ID (auto-generated)', 'employeeId')}
          {renderField('City', 'city')}
          {renderField('Country', 'country')}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: '#F9FAFB' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  name: { fontSize: 22, fontWeight: '600', marginTop: 12 },
  email: { fontSize: 14, color: '#666' },
  role: { fontSize: 14, color: '#fafafa', backgroundColor: "#003891", padding: 2, paddingHorizontal: 15, borderRadius: 18, marginTop: 7 },
  infoCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginVertical: 20, elevation: 2 },
  infoText: { fontSize: 14, color: '#333', marginBottom: 6 },
  editButton: { backgroundColor: '#fafafa', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: "#003891" },
  editButtonText: { color: '#003891', fontWeight: '600' },
  logoutButton: { backgroundColor: '#003891', padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600' },
  modalContent: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { fontSize: 14, marginBottom: 4, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, backgroundColor: '#fff' },
  error: { color: 'red', fontSize: 12 },
  saveButton: { backgroundColor: '#003891', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelButton: { padding: 14, alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#003891', fontWeight: '600' },
  imagePicker: { marginBottom: 16, alignItems: 'center' },
  imagePickerText: { color: '#003891', fontWeight: '600', marginBottom: 6 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, overflow: 'hidden' },
  picker: { width: '100%' },
});

export default ProfileScreen;
