import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, ScrollView,
    PermissionsAndroid, Platform, KeyboardAvoidingView,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import ImageUploader from './ImageUploader';
import { Fetch, Post, Put } from '../../utils/apiUtils';
import Icons from 'react-native-vector-icons/Ionicons';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { LocationContext } from '../../context/LocationContextProvider';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    LocationPicker: { initial: { start: LocationPoint | null; end: LocationPoint | null }; onPick: (locs: { start: LocationPoint | null; end: LocationPoint | null }) => void };
    TrackingForm: undefined;
};

type TrackingFormNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface LocationPoint { latitude: number; longitude: number; }
interface GeoPoint { type: 'Point'; coordinates: [number, number]; }
interface Project { _id: string; title: string; }
interface Image { uri: string; name: string; type: string; }

interface FormDataType {
    assetId: string;
    remarks: string | null;
    location: GeoPoint;
    image: Image[];
    project: string;
}

const assetSchema = yup.object().shape({
    assetId: yup.string().required('Asset ID is required').trim().min(3, 'Asset ID must be at least 3 characters'),
    remarks: yup.string().max(500, 'Remarks cannot exceed 500 characters').nullable(),
    location: yup.object().shape({
        type: yup.string().required().matches(/^Point$/, 'Location must be Point'),
        coordinates: yup.array().of(yup.number().required()).length(2).required(),
    }),
    image: yup.array().max(10, 'Maximum 10 images allowed').nullable(),
    project: yup.string().required('Project is required'),
});

export default function TrackingFormScreen() {
    const route: any = useRoute();
    const projectId: string | undefined = route.params?.projectId;
    const assetId: string | undefined = route.params?.assetId;

    const [assets, setAssets] = useState<any>(null);
    const { location, error, getCurrentLocation, markerStart, setMarkerStart } = useContext(LocationContext);
    const navigation = useNavigation<TrackingFormNavigationProp>();
    const isFocused = useIsFocused();

    const { control, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormDataType>({
        resolver: yupResolver(assetSchema),
        defaultValues: {
            assetId: assetId ? '' : '', // will fill after fetch
            remarks: null,
            location: {
                type: 'Point',
                coordinates: [markerStart?.longitude || 0, markerStart?.latitude || 0],
            },
            image: [],
            project: projectId || '',
        },
    });

    const [loadingLocation, setLoadingLocation] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);

    const fetchProjects = useCallback(async () => {
        try {
            const res: any = await Fetch('/api/projects', {}, 5000);
            if (!res.success) throw new Error(res.message || 'Failed to load projects');
            setProjects(res.data?.result || []);
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message });
        }
    }, []);

    const fetchAssets = useCallback(async () => {
        try {
            const res: any = await Fetch(`/api/assets/${assetId}`, {}, 5000);
            if (!res.success) throw new Error(res.message || 'Failed to load asset');
            setAssets(res.data);
            const coords = res.data.location?.coordinates;
            reset({
                assetId: res.data.assetId || '',
                remarks: res.data.remarks || null,
                location: {
                    type: 'Point',
                    coordinates: coords && coords.length === 2
                        ? [coords[0], coords[1]]
                        : [markerStart?.longitude || 0, markerStart?.latitude || 0],
                },
                image: res.data.image || [],
                project: res.data.project || projectId || '',
            });
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message });
        }
    }, [assetId, markerStart, projectId, reset]);

    useEffect(() => {
        if (isFocused) fetchProjects();
    }, [isFocused, fetchProjects]);

    useEffect(() => {
        if (isFocused && assetId) fetchAssets();
    }, [isFocused, assetId, fetchAssets]);

    const requestLocation = useCallback(async () => {
        try {
            setIsLoading(true);
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Toast.show({ type: 'error', text1: 'Location permission denied' });
                    return;
                }
            }
            Geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setValue('location', { type: 'Point', coordinates: [longitude, latitude] });
                    setMarkerStart({ latitude, longitude });
                    setLoadingLocation(false);
                },
                (error) => {
                    Toast.show({ type: 'error', text1: error.message });
                    setLoadingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        } catch {
            Toast.show({ type: 'error', text1: 'Error fetching location' });
        } finally {
            setIsLoading(false);
        }
    }, [setValue, setMarkerStart]);

    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    const handleLocationPick = useCallback(({ start }: { start: LocationPoint | null; end: LocationPoint | null }) => {
        if (start) {
            setValue('location', { type: 'Point', coordinates: [start.longitude, start.latitude] });
            setMarkerStart(start);
            setLoadingLocation(false);
        }
    }, [setValue, setMarkerStart]);

    const openLocationPicker = useCallback(() => {
        navigation.navigate('LocationPicker', {
            initial: { start: markerStart, end: null },
            onPick: handleLocationPick,
        });
    }, [navigation, markerStart, handleLocationPick]);

    const onSubmit = useCallback(async (data: FormDataType) => {
        const form = new FormData();
        form.append('project', data.project);
        form.append('assetId', data.assetId);
        if (data.remarks) form.append('remarks', data.remarks);
        form.append('location', JSON.stringify(data.location));
        data.image.forEach((img, i) => {
            if (img?.uri) form.append(`image${i}`, {
                uri: img.uri, name: img.name || `img${i}.jpg`, type: img.type || 'image/jpeg',
            });
        });

        try {
            const url = assetId ? `/api/assets/${assetId}` : '/api/assets';
            const Method = assetId ? Put : Post;
            const res = await Method(url, form, 5000);
            if (!res.success) throw new Error(res.message || 'Server error');
            Toast.show({ type: 'success', text1: 'Asset submitted successfully!' });
            reset();
            setMarkerStart(null);
            navigation.goBack();
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message });
        }
    }, [assetId, navigation, reset, setMarkerStart]);

    if (loadingLocation && isLoading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icons name="arrow-back" size={25} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{assetId ? 'Edit Asset' : 'Create Asset'}</Text>
                </View>

                {/* Project Picker */}
                <Text style={styles.label}>Project*</Text>
                <Controller
                    control={control}
                    name="project"
                    render={({ field: { onChange, value } }) => (
                        <View style={[styles.pickerContainer, errors.project && styles.inputError]}>
                            <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                                <Picker.Item label="Select Project" value="" />
                                {projects.map(p => <Picker.Item key={p._id} label={p.title} value={p._id} />)}
                            </Picker>
                        </View>
                    )}
                />
                {errors.project && <Text style={styles.error}>{errors.project.message}</Text>}

                {/* Asset ID */}
                <Text style={styles.label}>Asset ID*</Text>
                <Controller
                    control={control}
                    name="assetId"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={[styles.input, errors.assetId && styles.inputError]}
                            placeholder="Enter Asset ID"
                            placeholderTextColor="#999"
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
                {errors.assetId && <Text style={styles.error}>{errors.assetId.message}</Text>}

                {/* Remarks */}
                <Text style={styles.label}>Remarks</Text>
                <Controller
                    control={control}
                    name="remarks"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={[styles.input, styles.multiline, errors.remarks && styles.inputError]}
                            placeholder="Optional remarks"
                            placeholderTextColor="#999"
                            value={value || ''}
                            onChangeText={onChange}
                            multiline
                            numberOfLines={3}
                        />
                    )}
                />
                {errors.remarks && <Text style={styles.error}>{errors.remarks.message}</Text>}

                {/* Location */}
                <View style={styles.locationRow}>
                    <Text style={styles.label}>Location*</Text>
                    <View style={styles.locationButtons}>
                        <TouchableOpacity onPress={requestLocation} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator size="small" color="#007AFF" /> : <Icons name="location" size={25} color="#007AFF" />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={openLocationPicker}><Text style={styles.locationPickerText}>Pick on Map</Text></TouchableOpacity>
                    </View>
                </View>
                <Controller
                    control={control}
                    name="location"
                    render={({ field: { value } }) => (
                        <TouchableOpacity style={[styles.input2, errors.location && styles.inputError]} onPress={openLocationPicker}>
                            <Text style={styles.inputText}>
                                {value.coordinates ? `${value.coordinates[1]}, ${value.coordinates[0]}` : 'Select location'}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
                {errors.location && <Text style={styles.error}>{errors.location.message}</Text>}

                {/* Image Uploader */}
                <Text style={styles.label}>Upload Images</Text>
                <Controller
                    control={control}
                    name="image"
                    render={({ field: { value } }) => (
                        <ImageUploader images={value} onImages={imgs => setValue('image', imgs)} max={10} />
                    )}
                />
                {errors.image && <Text style={styles.error}>{errors.image.message}</Text>}

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : (assetId ? 'Update Asset' : 'Create Asset')}</Text>
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
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
        marginBottom: 6,
    },
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
    picker: { color: '#333' },
    error: { color: '#FF3B30', fontSize: 14, marginTop: 4 },
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
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 6,
    },
    locationButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationPickerText: {
        color: '#007AFF',
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
    },
});