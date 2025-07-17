import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, StyleSheet, Platform, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import { MultiSelect } from 'react-native-element-dropdown';
import Icons from 'react-native-vector-icons/Ionicons';
import { Fetch, Put, Post } from '../../utils/apiUtils';
import ImageUploader from '../../components/common/ImageUploader';

// Define navigation and route types
type RootStackParamList = {
  LocationPicker: {
    initial: { start: LocationPoint | null; end: LocationPoint | null };
    onPick: (locations: { start: LocationPoint | null; end: LocationPoint | null }) => void;
  };
  ProjectForm: { projectId?: string };
};

type ProjectFormRouteProp = RouteProp<RootStackParamList, 'ProjectForm'>;
type ProjectFormNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define data types
interface LocationPoint {
  latitude: number;
  longitude: number;
}

interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

interface User {
  _id: string;
  name: string;
}

interface Image {
  uri: string;
  name: string;
  type: string;
}

interface ProjectFormData {
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  budget: number | null;
  startLocation: GeoPoint;
  endLocation: GeoPoint;
  address: string | null;
  country: string | null;
  city: string | null;
  manager: string | null;
  team: string[];
  images: Image[];
}

// Yup schema for form validation
const projectSchema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().max(500, 'Description cannot exceed 500 characters').nullable(),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date().min(yup.ref('startDate'), 'End date must be after start date').nullable(),
  status: yup
    .string()
    .oneOf(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'], 'Invalid status')
    .required('Status is required'),
  budget: yup.number().positive('Budget must be positive').nullable(),
  startLocation: yup
    .object({
      type: yup.string().required('Location type is required'),
      coordinates: yup.array().length(2, 'Coordinates must have exactly 2 values').of(yup.number()).required('Coordinates are required'),
    })
    .required('Start location is required'),
  endLocation: yup
    .object({
      type: yup.string().required('Location type is required'),
      coordinates: yup.array().length(2, 'Coordinates must have exactly 2 values').of(yup.number()).required('Coordinates are required'),
    })
    .required('End location is required'),
  address: yup.string().nullable(),
  country: yup.string().nullable(),
  city: yup.string().nullable(),
  manager: yup.string().nullable(),
  team: yup.array().of(yup.string()).nullable(),
  images: yup.array().max(10, 'Maximum 10 images allowed').nullable(),
});

export default function ProjectFormScreen() {
  const route = useRoute<ProjectFormRouteProp>();
  const navigation = useNavigation<ProjectFormNavigationProp>();
  const projectId = route.params?.projectId;

  const { control, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ProjectFormData>({
    defaultValues: {
      title: '',
      description: null,
      startDate: new Date(),
      endDate: null,
      status: 'not_started',
      budget: null,
      startLocation: { type: 'Point', coordinates: [0, 0] },
      endLocation: { type: 'Point', coordinates: [0, 0] },
      address: null,
      country: null,
      city: null,
      manager: null,
      team: [],
      images: [],
    },
    resolver: yupResolver(projectSchema),
  });

  const [loading, setLoading] = useState<boolean>(!!projectId);
  const [users, setUsers] = useState<User[]>([]);
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      Fetch(`/api/projects/${projectId}`)
        .then((res: any) => {
          if (!res.success) throw new Error(res.message);
          const d = res.data;
          reset({
            title: d.title || '',
            description: d.description || null,
            startDate: new Date(d.startDate),
            endDate: d.endDate ? new Date(d.endDate) : null,
            status: d.status || 'not_started',
            budget: d.budget || null,
            startLocation: d.startLocation || { type: 'Point', coordinates: [0, 0] },
            endLocation: d.endLocation || { type: 'Point', coordinates: [0, 0] },
            address: d.address || null,
            country: d.country || null,
            city: d.city || null,
            manager: d.manager?._id || null,
            team: d.team?.map((u: User) => u._id) || [],
            images: [],
          });
        })
        .catch((e: Error) => Toast.show({ type: 'error', text1: e.message }))
        .finally(() => setLoading(false));
    }
  }, [projectId, reset]);

  useEffect(() => {
    Fetch('/api/auth/users')
      .then((res: any) => {
        if (!res.success) throw new Error(res.message);
        setUsers(res.data.users || []);
      })
      .catch((e: Error) => Toast.show({ type: 'error', text1: e.message }));
  }, []);

  const pickLocation = useCallback(
    (fieldName: 'startLocation' | 'endLocation') => {
      navigation.navigate('LocationPicker', {
        initial: { start: null, end: null },
        onPick: ({ start, end }: { start: LocationPoint | null; end: LocationPoint | null }) => {
          const point = fieldName === 'startLocation' ? start : end;
          if (point) {
            setValue(fieldName, { type: 'Point', coordinates: [point.longitude, point.latitude] });
          }
        },
      });
    },
    [navigation, setValue]
  );

  const onSubmit = useCallback(
    async (data: ProjectFormData) => {
      const form = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' && value) {
          value.forEach((img, i) => {
            form.append('images', { uri: img.uri, name: img.name || `img${i}.jpg`, type: img.type || 'image/jpeg' });
          });
        } else if (['startLocation', 'endLocation'].includes(key) && value) {
          form.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          value.forEach((val) => form.append(key, val));
        } else if (value != null && value !== '') {
          form.append(key, key === 'budget' ? String(value) : String(value));
        }
      });

      try {
        const method = projectId ? Put : Post;
        const url = projectId ? `/api/projects/${projectId}` : '/api/projects';
        const res = await method(url, form);
        if (!res.success) throw new Error(res.message);
        Toast.show({ type: 'success', text1: projectId ? 'Project Updated' : 'Project Created' });
        reset();
        navigation.goBack();
      } catch (e: any) {
        Toast.show({ type: 'error', text1: e.message || 'An error occurred' });
      }
    },
    [projectId, reset, navigation]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icons name="arrow-back" size={25} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{projectId ? 'Edit Project' : 'Create Project'}</Text>
        </View>

        <Text style={styles.label}>Project Title*</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="Enter project title"
              placeholderTextColor="#999"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}

        <Text style={styles.label}>Description</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.multiline, errors.description && styles.inputError]}
              placeholder="Enter project description"
              placeholderTextColor="#999"
              value={value || ''}
              onChangeText={onChange}
              multiline
            />
          )}
        />
        {errors.description && <Text style={styles.error}>{errors.description.message}</Text>}

        <Text style={styles.label}>Start Date*</Text>
        <Controller
          control={control}
          name="startDate"
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                style={[styles.input2, errors.startDate && styles.inputError]}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.inputText}>
                  {value ? value.toLocaleDateString() : 'Select start date'}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={value || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartPicker(Platform.OS !== 'ios');
                    if (date) setValue('startDate', date);
                  }}
                />
              )}
            </>
          )}
        />
        {errors.startDate && <Text style={styles.error}>{errors.startDate.message}</Text>}

        <Text style={styles.label}>End Date</Text>
        <Controller
          control={control}
          name="endDate"
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                style={[styles.input2, errors.endDate && styles.inputError]}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.inputText}>
                  {value ? value.toLocaleDateString() : 'Select end date'}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={value || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndPicker(Platform.OS !== 'ios');
                    if (date) setValue('endDate', date);
                  }}
                />
              )}
            </>
          )}
        />
        {errors.endDate && <Text style={styles.error}>{errors.endDate.message}</Text>}

        <Text style={styles.label}>Status*</Text>
        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <View style={[styles.pickerContainer, errors.status && styles.inputError]}>
              <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                <Picker.Item label="Not Started" value="not_started" />
                <Picker.Item label="In Progress" value="in_progress" />
                <Picker.Item label="On Hold" value="on_hold" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="Cancelled" value="cancelled" />
              </Picker>
            </View>
          )}
        />
        {errors.status && <Text style={styles.error}>{errors.status.message}</Text>}

        <Text style={styles.label}>Budget</Text>
        <Controller
          control={control}
          name="budget"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.budget && styles.inputError]}
              placeholder="Enter budget"
              placeholderTextColor="#999"
              value={value ? value.toString() : ''}
              onChangeText={onChange}
              keyboardType="numeric"
            />
          )}
        />
        {errors.budget && <Text style={styles.error}>{errors.budget.message}</Text>}

        {(['address', 'country', 'city'] as const).map((fieldName) => (
          <View key={fieldName}>
            <Text style={styles.label}>{fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}</Text>
            <Controller
              control={control}
              name={fieldName}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors[fieldName] && styles.inputError]}
                  placeholder={`Enter ${fieldName}`}
                  placeholderTextColor="#999"
                  value={value || ''}
                  onChangeText={onChange}
                />
              )}
            />
            {errors[fieldName] && <Text style={styles.error}>{errors[fieldName]?.message}</Text>}
          </View>
        ))}

        <Text style={styles.label}>Manager</Text>
        <Controller
          control={control}
          name="manager"
          render={({ field: { onChange, value } }) => (
            <View style={[styles.pickerContainer, errors.manager && styles.inputError]}>
              <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                <Picker.Item label="Select Manager" value="" />
                {users.map((user) => (
                  <Picker.Item key={user._id} label={user.name} value={user._id} />
                ))}
              </Picker>
            </View>
          )}
        />
        {errors.manager && <Text style={styles.error}>{errors.manager.message}</Text>}

        <Text style={styles.label}>Team Members</Text>
        <Controller
          control={control}
          name="team"
          render={({ field: { onChange, value } }) => (
            <MultiSelect
              style={[styles.dropdown, errors.team && styles.inputError]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              search
              data={users.map((u) => ({ label: u.name, value: u._id }))}
              labelField="label"
              valueField="value"
              placeholder="Select team members"
              searchPlaceholder="Search team..."
              value={value}
              onChange={onChange}
              maxHeight={300}
              showsVerticalScrollIndicator
              selectedStyle={styles.selectedStyle}
              activeColor="#007AFF"
            />
          )}
        />
        {errors.team && <Text style={styles.error}>{errors.team.message}</Text>}

        <Text style={styles.label}>Start Location</Text>
        <Controller
          control={control}
          name="startLocation"
          render={({ field: { value } }) => (
            <TouchableOpacity
              style={[styles.input2, errors.startLocation && styles.inputError]}
              onPress={() => pickLocation('startLocation')}
            >
              <Text style={styles.inputText}>
                {value.coordinates ? value.coordinates.join(', ') : 'Select start location'}
              </Text>
            </TouchableOpacity>
          )}
        />
        {errors.startLocation && <Text style={styles.error}>{errors.startLocation.message}</Text>}

        <Text style={styles.label}>End Location</Text>
        <Controller
          control={control}
          name="endLocation"
          render={({ field: { value } }) => (
            <TouchableOpacity
              style={[styles.input2, errors.endLocation && styles.inputError]}
              onPress={() => pickLocation('endLocation')}
            >
              <Text style={styles.inputText}>
                {value.coordinates ? value.coordinates.join(', ') : 'Select end location'}
              </Text>
            </TouchableOpacity>
          )}
        />
        {errors.endLocation && <Text style={styles.error}>{errors.endLocation.message}</Text>}

        <Text style={styles.label}>Images</Text>
        <Controller
          control={control}
          name="images"
          render={({ field: { value } }) => (
            <ImageUploader
              images={value}
              onImages={(imgs) => setValue('images', imgs)}
              max={10}
            />
          )}
        />
        {errors.images && <Text style={styles.error}>{errors.images.message}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Saving...' : projectId ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContainer: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backButton: { position: 'absolute', left: 0 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  input2: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  inputError: { borderColor: '#FF3B30' },
  inputText: { fontSize: 16, color: '#333' },
  multiline: { height: 100, textAlignVertical: 'top', paddingVertical: 10 },
  pickerContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: { height: 48 },
  error: { color: '#FF3B30', fontSize: 14, marginTop: 4 },
  dropdown: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  placeholderStyle: { fontSize: 16, color: '#999' },
  selectedTextStyle: { fontSize: 16, color: '#333' },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  selectedStyle: { borderRadius: 12, backgroundColor: '#E6F0FA' },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonDisabled: { backgroundColor: '#A5D6FF' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});