import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Button, ScrollView, ActivityIndicator,
    StyleSheet, Platform, TouchableOpacity
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Geolocation from '@react-native-community/geolocation';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import ImageUploader from './ImageUploader';
import LocationPicker from './LocationPicker';
import { Fetch, Post, Put } from '../../utils/apiUtils';
import { MultiSelect } from 'react-native-element-dropdown';  // <-- NEW import
import Icons from "react-native-vector-icons/Ionicons"

const projectSchema = yup.object({
    title: yup.string().required('Title is required'),
    description: yup.string(),
    startDate: yup.string().required('Start date is required'),
    endDate: yup
        .string()
        .test('endDate', 'End date must be after start', function (value) {
            const { startDate } = this.parent;
            return !startDate || !value || new Date(value) >= new Date(startDate);
        }),
    status: yup
        .string()
        .oneOf(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'])
        .required('Status is required'),
    budget: yup.number().typeError('Budget must be a number').positive('Must be positive'),
    location: yup.object({
        type: yup.string().required(),
        coordinates: yup.array().of(yup.number()).length(2).required('Set location'),
    }).required(),
    address: yup.string(),
    country: yup.string(),
    city: yup.string(),
    manager: yup.string(),
    team: yup.array().of(yup.string()),
    images: yup.array(),
});

export default function ProjectFormScreen() {
    const route: any = useRoute();
    const navigation = useNavigation();
    const projectId = route.params?.projectId;

    const { control, handleSubmit, setValue, reset, formState: { errors, isSubmitting } }: any = useForm<any>({
        defaultValues: {
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'not_started',
            budget: '',
            location: null,
            address: '',
            country: '',
            city: '',
            manager: '',
            team: [],
            images: [],
        },
        resolver: yupResolver(projectSchema),
    });

    const [loading, setLoading] = useState(!!projectId);
    const [users, setUsers] = useState([]);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        if (projectId) {
            Fetch(`/api/projects/${projectId}`)
                .then((res: any) => console.log(res.data))
                .then(data => {
                    reset({
                        ...data,
                        startDate: data.startDate?.split('T')[0],
                        endDate: data.endDate?.split('T')[0],
                        budget: data.budget?.toString(),
                        manager: data.manager?._id || '',
                        team: data.team?.map((user: any) => user._id) || [],
                    });
                })
                .catch(err => Toast.show({ type: 'error', text1: err.message }))
                .finally(() => setLoading(false));
        }
    }, [projectId]);

    useEffect(() => {
        Geolocation.requestAuthorization();
        Geolocation.getCurrentPosition(
            pos => {
                setValue('location', { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] });
            },
            err => console.warn(err),
            { enableHighAccuracy: true }
        );
    }, []);

    useEffect(() => {
        // Replace this with your API fetch
        // const dummyUsers: any = Array.from({ length: 100 }, (_, i) => ({
        //     _id: String(i + 1),
        //     name: `User ${i + 1}`,
        // }));
        // setUsers(dummyUsers);

        // If you have real API, uncomment below:

        Fetch('/api/auth/user', {}, 5000)
            .then((res: any) => res.data?.users)
            .then(setUsers)
            .catch(err => Toast.show({ type: 'error', text1: err.message }));

    }, []);

    const onSubmit = async (data: any) => {
        const form = new FormData();
        Object.entries(data).forEach(([k, v]: any) => {
            if (k === 'images') {
                v.forEach((img: any) => form.append('images', {
                    uri: img.uri,
                    name: img.name,
                    type: img.type,
                }));
            } else if (k === 'location') {
                form.append('location', JSON.stringify(v));
            } else if (k === 'team') {
                v.forEach((id: any) => form.append('team', id));
            } else {
                form.append(k, k === 'budget' ? parseFloat(v) : v);
            }
        });

        try {
            const Method = projectId ? Put : Post;
            const res: any = await Method(projectId ? `/api/projects/${projectId}` : '/api/projects', form, 5000);
            console.log(res, form, Method, data)
            if (!res.success) throw new Error('Server error');
            Toast.show({ type: 'success', text1: projectId ? 'Updated!' : 'Created!' });
            reset()
            navigation.goBack();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.message });
        }
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: "center" }}>
                <TouchableOpacity onPress={()=>navigation.goBack()} style={{ position: "absolute", left: 10 }}>
                    <Icons name="arrow-back" size={25} />
                </TouchableOpacity>
                <Text style={{ fontSize: 19, textAlign: "center", }}>
                    {"Create"} Project
                </Text>
            </View>
            {/* Title */}
            <Text style={styles.label}>Project Title*</Text>
            <Controller name="title" control={control} render={({ field }) => (
                <TextInput style={styles.input} placeholder="Title" value={field.value} onChangeText={field.onChange} />
            )} />
            {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <Controller name="description" control={control} render={({ field }) => (
                <TextInput style={[styles.input, styles.multiline]} placeholder="Description" value={field.value} onChangeText={field.onChange} multiline />
            )} />

            {/* Start Date */}
            <Text style={styles.label}>Start Date*</Text>
            <Controller name="startDate" control={control} render={({ field }) => (
                <>
                    <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.input}>
                        <Text>{field.value || 'Select start date'}</Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                        <DateTimePicker
                            value={field.value ? new Date(field.value) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowStartPicker(false);
                                if (date) {
                                    const formatted = date.toISOString().split('T')[0];
                                    field.onChange(formatted);
                                }
                            }}
                        />
                    )}
                </>
            )} />
            {errors.startDate && <Text style={styles.error}>{errors.startDate.message}</Text>}

            {/* End Date */}
            <Text style={styles.label}>End Date</Text>
            <Controller name="endDate" control={control} render={({ field }) => (
                <>
                    <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.input}>
                        <Text>{field.value || 'Select end date'}</Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                        <DateTimePicker
                            value={field.value ? new Date(field.value) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowEndPicker(false);
                                if (date) {
                                    const formatted = date.toISOString().split('T')[0];
                                    field.onChange(formatted);
                                }
                            }}
                        />
                    )}
                </>
            )} />
            {errors.endDate && <Text style={styles.error}>{errors.endDate.message}</Text>}

            {/* Status */}
            <Text style={styles.label}>Status*</Text>
            <Controller name="status" control={control} render={({ field }) => (
                <Picker selectedValue={field.value} onValueChange={field.onChange} style={{ borderWidth: 1 }}>
                    <Picker.Item label="Not Started" value="not_started" />
                    <Picker.Item label="In Progress" value="in_progress" />
                    <Picker.Item label="On Hold" value="on_hold" />
                    <Picker.Item label="Completed" value="completed" />
                    <Picker.Item label="Cancelled" value="cancelled" />
                </Picker>
            )} />
            {errors.status && <Text style={styles.error}>{errors.status.message}</Text>}

            {/* Budget */}
            <Text style={styles.label}>Budget</Text>
            <Controller name="budget" control={control} render={({ field }) => (
                <TextInput style={styles.input} placeholder="Budget" value={field.value} onChangeText={field.onChange} keyboardType="numeric" />
            )} />
            {errors.budget && <Text style={styles.error}>{errors.budget.message}</Text>}

            {/* Address, Country, City */}
            {['address', 'country', 'city'].map((fieldName) => (
                <View key={fieldName}>
                    <Text style={styles.label}>{fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}</Text>
                    <Controller name={fieldName} control={control} render={({ field }) => (
                        <TextInput style={styles.input} placeholder={fieldName} value={field.value} onChangeText={field.onChange} />
                    )} />
                </View>
            ))}

            {/* Manager */}
            <Text style={styles.label}>Manager</Text>
            <Controller name="manager" control={control} render={({ field }) => (
                <Picker selectedValue={field.value} onValueChange={field.onChange} style={{ borderWidth: 1 }}>
                    <Picker.Item label="Select Manager" value="" />
                    {users.map((user: any) => (
                        <Picker.Item key={user._id} label={user.name} value={user._id} />
                    ))}
                </Picker>
            )} />

            {/* Team Members with searchable MultiSelect */}
            <Text style={styles.label}>Team Members</Text>
            <Controller name="team" control={control} render={({ field }) => (
                <MultiSelect
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    search
                    data={users.map((u: any) => ({ label: u.name, value: u._id }))}
                    labelField="label"
                    valueField="value"
                    placeholder="Select team members"
                    searchPlaceholder="Search team..."
                    value={field.value}
                    onChange={field.onChange}
                    maxHeight={300}
                    showsVerticalScrollIndicator
                />
            )} />
            {errors.team && <Text style={styles.error}>{errors.team.message}</Text>}

            {/* Location Picker */}
            <Text style={styles.label}>Location*</Text>
            <LocationPicker defaultValue={null} onLocation={(loc: any) => setValue('location', loc)} />
            {errors.location && <Text style={styles.error}>{errors.location.coordinates?.message || 'Set location on map'}</Text>}

            {/* Image Upload */}
            <Text style={styles.label}>Images</Text>
            <ImageUploader onImages={(imgs: any) => setValue('images', imgs)} />
            {errors.images && <Text style={styles.error}>Image upload error</Text>}

            {/* Submit */}
            <Button title={isSubmitting ? 'Saving...' : projectId ? 'Update Project' : 'Create Project'} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} />

            {Platform.OS === 'ios' && <View style={{ height: 40 }} />}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, height: 40, justifyContent: 'center', marginBottom: 8 },
    multiline: { height: 80, textAlignVertical: 'top' },
    label: { fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
    error: { color: 'red', marginBottom: 8 },
    dropdown: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    placeholderStyle: { fontSize: 14, color: '#999' },
    selectedTextStyle: { fontSize: 14, color: '#000' },
    inputSearchStyle: {
        height: 40,
        fontSize: 14,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
    },
});
