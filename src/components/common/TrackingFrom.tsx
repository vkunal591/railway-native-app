import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, ScrollView, PermissionsAndroid, Platform
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import ImageUploader from './ImageUploader';
import { Fetch, Post } from '../../utils/apiUtils';
import Icons from 'react-native-vector-icons/Entypo';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

type FormDataType = {
    assetId: string;
    remarks: string;
    location: {
        type: string;
        coordinates: [number, number];
    };
    image: any[];
};

const assetSchema = yup.object().shape({
    assetId: yup.string().required('Asset ID is required').trim(),
    remarks: yup.string().max(500, 'Remarks cannot exceed 500 characters'),
    location: yup.object().shape({
        type: yup.string().required().matches(/^Point$/, 'Location type must be Point'),
        coordinates: yup
            .array()
            .of(yup.number().required())
            .length(2, 'Coordinates must be an array of [longitude, latitude]')
            .required('Location is required'),
    }),
    // image: yup.array().min(1, 'At least one image is required'), // Uncomment if images are required
});

export default function TrackingFormScreen() {
    const navigation = useNavigation<any>();
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectProject, setSelectProject] = useState<string | null>(null);
    const isFocused = useIsFocused();

    const {
        control,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting }
    }: any = useForm<any>({
        resolver: yupResolver(assetSchema),
        defaultValues: {
            assetId: '',
            remarks: '',
            location: {
                type: 'Point',
                coordinates: [0, 0],
            },
            image: [],
        }
    });

    const fetchProjects = async () => {
        try {
            const res: any = await Fetch(`/api/projects`);
            const data = res?.data?.result;
            setProjects(data || []);
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message || 'Failed to load projects' });
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchProjects();
        }
    }, [isFocused]);

    const requestLocation = async () => {
        try {
            setIsLoading(true);
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Toast.show({ type: 'error', text1: 'Location permission denied' });
                    return;
                }
            }
            Geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setValue('location', { type: 'Point', coordinates: [longitude, latitude] });
                    setLoadingLocation(false);
                },
                (error) => {
                    Toast.show({ type: 'error', text1: error.message });
                    setLoadingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error fetching location' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        requestLocation();
    }, []);

    const handleLocationPick = ({ start }: { start: { latitude: number; longitude: number } }) => {
        if (start) {
            setValue('location', { type: 'Point', coordinates: [start.longitude, start.latitude] });
            setLoadingLocation(false);
        }
    };

    const openLocationPicker = () => {
        navigation.navigate('LocationPickerScreen', {
            initial: { start: { latitude: 0, longitude: 0 } },
            onPick: handleLocationPick,
        });
    };

    const onSubmit: any = async (data: FormDataType) => {
        if (!selectProject) {
            Toast.show({ type: 'error', text1: 'Please select a project' });
            return;
        }

        const form = new FormData();
        form.append('project', selectProject);
        form.append('assetId', data.assetId);
        form.append('remarks', data.remarks || '');
        form.append('location', JSON.stringify(data.location));
        data.image.forEach((img: any, index: number) => {
            form.append('image', {
                uri: img.uri,
                name: img.name,
                type: img.type,
            });
        });

        try {
            const res: any = await Post('/api/assets', form, 5000);
            if (!res.success) throw new Error(res?.message || 'Server error');
            Toast.show({ type: 'success', text1: 'Asset created successfully!' });
            reset();
            setSelectProject(null);
            navigation.goBack();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.message || 'Failed to create asset' });
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Asset</Text>

            <Text style={styles.label}>Project*</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={selectProject}
                    onValueChange={(value) => setSelectProject(value)}
                >
                    <Picker.Item label="Select Project" value="" />
                    {projects.map((project) => (
                        <Picker.Item
                            key={project._id}
                            label={project.name}
                            value={project._id}
                        />
                    ))}
                </Picker>
            </View>

            <Text style={styles.label}>Asset ID*</Text>
            <Controller
                name="assetId"
                control={control}
                render={({ field }) => (
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Asset ID"
                        value={field.value}
                        onChangeText={field.onChange}
                    />
                )}
            />
            {errors.assetId && <Text style={styles.error}>{errors.assetId.message}</Text>}

            <Text style={styles.label}>Remarks</Text>
            <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                    <TextInput
                        style={[styles.input, styles.multiline]}
                        placeholder="Optional remarks (max 500 characters)"
                        multiline
                        numberOfLines={3}
                        value={field.value}
                        onChangeText={field.onChange}
                    />
                )}
            />
            {errors.remarks && <Text style={styles.error}>{errors.remarks.message}</Text>}

            <View style={styles.locationRow}>
                <Text style={styles.label}>Location*</Text>
                <View style={styles.locationButtons}>
                    <TouchableOpacity onPress={requestLocation}>
                        {isLoading ? <ActivityIndicator /> : <Icons name="location" size={25} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openLocationPicker}>
                        <Text style={styles.locationPickerText}>Pick on Map</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loadingLocation ? (
                <ActivityIndicator size="small" />
            ) : (
                <>
                    <Controller
                        name="location.coordinates.1"
                        control={control}
                        render={({ field }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Latitude"
                                value={field.value?.toString() || ''}
                                editable={false}
                            />
                        )}
                    />
                    <Controller
                        name="location.coordinates.0"
                        control={control}
                        render={({ field }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Longitude"
                                value={field.value?.toString() || ''}
                                editable={false}
                            />
                        )}
                    />
                </>
            )}
            {errors.location && <Text style={styles.error}>{errors.location.message}</Text>}

            <Text style={styles.label}>Upload Images</Text>
            <ImageUploader onImages={(imgs) => setValue('image', imgs)} />
            {errors.image && <Text style={styles.error}>{errors.image.message}</Text>}

            <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
            >
                <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Create Asset'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    label: { marginBottom: 4, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        paddingHorizontal: 10,
        height: 40,
        marginBottom: 10,
    },
    multiline: { height: 80, textAlignVertical: 'top' },
    error: { color: 'red', marginBottom: 8 },
    submitBtn: {
        backgroundColor: '#007BFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitText: { color: '#fff', fontWeight: 'bold' },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginBottom: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    locationButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationPickerText: {
        color: '#007BFF',
        marginLeft: 10,
        fontWeight: '600',
    },
});