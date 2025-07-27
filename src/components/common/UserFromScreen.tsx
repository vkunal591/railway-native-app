import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, ScrollView,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import Icons from 'react-native-vector-icons/Ionicons';
import { Fetch, Post, Put } from '../../utils/apiUtils';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

interface FormData {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'manager' | 'viewer';
    city: string;
    country: string;
    isActive: boolean;
}

export default function UserFormScreen() {
    const route: any = useRoute();
    const editingUserId: string | undefined = route.params?.userId;
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // 🧠 SCHEMA MOVED INSIDE COMPONENT
    const userSchema = yup.object().shape({
        name: yup.string().required('Name is required').min(2),
        email: yup.string().email('Invalid email').required('Email is required'),
        password: editingUserId
            ? yup.string() // password optional when editing
            : yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
        role: yup.string().oneOf(['admin', 'manager', 'viewer']).required('Role is required'),
        isActive: yup.boolean(),
    });

    const {
        control, handleSubmit, reset, formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: yupResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            role: 'viewer',
            city: '',
            country: '',
            isActive: true,
        },
    });

    const loadUser = useCallback(async () => {
        if (!editingUserId) return;
        setLoading(true);
        try {
            const res: any = await Fetch(`/api/auth/user/${editingUserId}`, {}, 5000);
            if (!res.success) throw new Error('Failed to fetch user');
            const u = res.data;
            reset({
                name: u.name,
                email: u.email,
                role: u.role,
                city: u.city || '',
                country: u.country || '',
                isActive: u.isActive === true || u.isActive === 'true',
            });
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message });
        } finally {
            setLoading(false);
        }
    }, [editingUserId, reset]);

    useEffect(() => {
        if (isFocused && editingUserId) loadUser();
    }, [isFocused, editingUserId, loadUser]);

    const onSubmit = useCallback(async (data: FormData) => {
        setLoading(true);
        try {
            const method = editingUserId ? Put : Post;
            const url = editingUserId ? `/api/auth/user/${editingUserId}` : '/api/auth/register';
            const payload = method === Post ? data : { ...data, isActive: data.isActive };

            const res: any = await method(url, payload, 5000);
            if (!res.success) throw new Error(res.message || 'Server error');

            Toast.show({ type: 'success', text1: editingUserId ? 'User updated' : 'User created' });
            reset();
            navigation.goBack();
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message });
        } finally {
            setLoading(false);
        }
    }, [editingUserId, reset, navigation]);

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{editingUserId ? 'Edit User' : 'New User'}</Text>
                </View>

                {/* Name */}
                <Text style={styles.label}>Name*</Text>
                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            placeholder="Name"
                            value={value}
                            onChangeText={onChange}
                            placeholderTextColor="gray"
                        />
                    )}
                />
                {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}

                {/* Email */}
                <Text style={styles.label}>Email*</Text>
                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={value}
                            onChangeText={onChange}
                            placeholderTextColor="gray"
                        />
                    )}
                />
                {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

                {/* Password */}
                {!editingUserId && (
                    <>
                        <Text style={styles.label}>Password*</Text>
                        <View style={styles.passwordContainer}>
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.passwordInput, errors.password && styles.inputError]}
                                        placeholder="Password"
                                        secureTextEntry={!showPassword}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholderTextColor="gray"
                                    />
                                )}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(prev => !prev)} style={styles.eyeIcon}>
                                <Icons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#555" />
                            </TouchableOpacity>
                        </View>
                        {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
                    </>
                )}

                {/* Role */}
                <Text style={styles.label}>Role*</Text>
                <Controller
                    control={control}
                    name="role"
                    render={({ field: { onChange, value } }) => (
                        <View style={[styles.pickerContainer, errors.role && styles.inputError]}>
                            <Picker style={{ color: "#000" }} selectedValue={value} onValueChange={onChange}>
                                <Picker.Item label="Viewer" value="viewer" />
                                <Picker.Item label="Manager" value="manager" />
                                <Picker.Item label="Admin" value="admin" />
                            </Picker>
                        </View>
                    )}
                />
                {errors.role && <Text style={styles.error}>{errors.role.message}</Text>}

                {/* Active Toggle */}
                <View style={styles.switchRow}>
                    <Text style={styles.label}>Status:</Text>
                    <Controller
                        control={control}
                        name="isActive"
                        render={({ field: { onChange, value } }) => (
                            <TouchableOpacity
                                style={[styles.toggleBtn, value ? styles.activeOn : styles.activeOff]}
                                onPress={() => onChange(!value)}
                            >
                                <Text style={styles.toggleText}>{value ? 'Active' : 'Inactive'}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && styles.submitDisabled]}
                    onPress={async () => {
                        try {
                            await handleSubmit(onSubmit)();
                        } catch (err) {
                            console.log("Form error", err);
                        }
                    }}
                >
                    <Text style={styles.submitText}>{editingUserId ? 'Update User' : 'Create User'}</Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    scroll: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { marginRight: 10 },
    title: { fontSize: 20, fontWeight: '600', color: '#333' },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 12 },
    input: {
        backgroundColor: '#fff', borderRadius: 8, borderWidth: 1,
        borderColor: '#ccc', paddingHorizontal: 12, height: 48, marginTop: 4, color: "#000"
    },
    inputError: { borderColor: '#FF3B30' },
    error: { color: '#FF3B30', marginTop: 4 },
    pickerContainer: {
        backgroundColor: '#fff', borderRadius: 8, borderWidth: 1,
        borderColor: '#ccc', marginTop: 4,
    },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    toggleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginLeft: 16 },
    activeOn: { backgroundColor: '#66bb6a' },
    activeOff: { backgroundColor: '#ef5350' },
    toggleText: { color: '#fff', fontWeight: '600' },
    submitBtn: {
        backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 14,
        alignItems: 'center', marginTop: 24,
    },
    submitDisabled: { backgroundColor: '#A5D6FF' },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    passwordContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 8,
        borderWidth: 1, borderColor: '#ccc',
        marginTop: 4, paddingHorizontal: 12,
    },
    passwordInput: {
        flex: 1, height: 48, color: '#000',
    },
    eyeIcon: {
        paddingHorizontal: 8,
    },
});
