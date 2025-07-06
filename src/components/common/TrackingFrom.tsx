import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, ScrollView, Button, PermissionsAndroid, Platform
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import ImageUploader from './ImageUploader'; // assumes you have this component
import { Post } from '../../utils/apiUtils';
import Icons from 'react-native-vector-icons/Entypo'
import { useNavigation } from '@react-navigation/native';

const assetSchema = yup.object().shape({
    assetId: yup.string().required('Asset ID is required'),
    remarks: yup.string(),
    latitude: yup.number().required('Latitude is required'),
    longitude: yup.number().required('Longitude is required'),
    // image: yup.array().min(1, 'At least one image is required'),
});

export default function TrackingFormScreen() {
    const navigation = useNavigation<any>()
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [isLoading, setIsLoading] = useState(false)
    const { control, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(assetSchema),
        defaultValues: {
            assetId: '',
            remarks: '',
            latitude: null,
            longitude: null,
            image: [],
        }
    });

    const requestLocation = async () => {
        try {
            setIsLoading(true)
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
                    console.log(latitude, longitude)
                    setValue('latitude', latitude);
                    setValue('longitude', longitude);
                    setLoadingLocation(false);
                },
                (error) => {
                    Toast.show({ type: 'error', text1: error.message });
                    setLoadingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        } catch (err) {
            console.warn(err);
            setLoadingLocation(false);
        } finally {
            setIsLoading(false)
        }
    };


    // 📍 Get current location with permission
    useEffect(() => {

        requestLocation();
    }, []);

    const onSubmit = async (data: any) => {
        const form = new FormData();
        Object.entries(data).forEach(([key, value]: any) => {
            if (key === 'image') {
                value.forEach((img: any) => {
                    form.append('image', {
                        uri: img.uri,
                        name: img.name,
                        type: img.type,
                    });
                });
            } else {
                form.append(key, value);
            }
        });

        try {
            const res: any = await Post('/api/assets', form, 5000);
            console.log(res, data, form)
            if (!res.success) throw new Error('Server error');
            Toast.show({ type: 'success', text1: 'Asset created successfully!' });
            reset()
            navigation.goBack()
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.message });
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Asset</Text>

            {/* Asset ID */}
            <Text style={styles.label}>Asset ID*</Text>
            <Controller name="assetId" control={control} render={({ field }) => (
                <TextInput
                    style={styles.input}
                    placeholder="Enter Asset ID"
                    value={field.value}
                    onChangeText={field.onChange}
                />
            )} />
            {errors.assetId && <Text style={styles.error}>{errors.assetId.message}</Text>}

            {/* Remarks */}
            <Text style={styles.label}>Remarks</Text>
            <Controller name="remarks" control={control} render={({ field }) => (
                <TextInput
                    style={[styles.input, styles.multiline]}
                    placeholder="Optional remarks"
                    multiline
                    numberOfLines={3}
                    value={field.value}
                    onChangeText={field.onChange}
                />
            )} />

            {/* Location */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={styles.label}>Location</Text>
                <TouchableOpacity style={{ padding: 5, borderRadius: 8 }} onPress={() =>
                    requestLocation()
                }>

                    {isLoading ? <ActivityIndicator /> : <Icons name="location" size={25} />}                </TouchableOpacity>
            </View>
            {
                loadingLocation ? (
                    <ActivityIndicator size="small" />
                ) : (
                    <>
                        <Controller name="latitude" control={control} render={({ field }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Latitude"
                                value={field.value?.toString()}
                                editable={false}
                            />
                        )} />
                        <Controller name="longitude" control={control} render={({ field }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Longitude"
                                value={field.value?.toString()}
                                editable={false}
                            />
                        )} />
                    </>
                )
            }
            {
                (errors.latitude || errors.longitude) && (
                    <Text style={styles.error}>Location is required</Text>
                )
            }

            {/* Image Upload */}
            <Text style={styles.label}>Upload Images*</Text>
            <ImageUploader onImages={(imgs) => setValue('image', imgs)} />
            {/* {errors.image && <Text style={styles.error}>{errors.image.message}</Text>} */}

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
                <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Create Asset'}</Text>
            </TouchableOpacity>
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    label: { marginBottom: 4, fontWeight: '600' },
    input: {
        borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
        paddingHorizontal: 10, height: 40, marginBottom: 10
    },
    multiline: { height: 80, textAlignVertical: 'top' },
    error: { color: 'red', marginBottom: 8 },
    submitBtn: {
        backgroundColor: '#007BFF', padding: 12, borderRadius: 8,
        alignItems: 'center', marginTop: 20
    },
    submitText: { color: '#fff', fontWeight: 'bold' }
});
