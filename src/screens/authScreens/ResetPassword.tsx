import React, { useRef, useEffect, useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ImageBackground,
    Animated,
    Dimensions,
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Toast from 'react-native-toast-message'
import LinearGradient from 'react-native-linear-gradient'
import { Post, TokenStorage } from '../../utils/apiUtils'
import { useNavigation } from '@react-navigation/native'

const { width } = Dimensions.get('window')

// Validation schema
const schema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
})

const ResetPassword = () => {
    const navigation = useNavigation<any>()
    const fadeAnim = useRef(new Animated.Value(0)).current
    const [loading, setLoading] = useState(false)
    const { control, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema),
    })

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start()
    }, [fadeAnim])

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const res: any = await Post('/api/auth/reset-password', data, 5000);
            const result = await res?.data;

            console.log('Reseet result:', result);

            if (!result?.success) {
                Toast.show({
                    type: 'error',
                    text1: result?.message || 'Invalid response. Reset failed.',
                });
                return;
            }


            Toast.show({
                type: 'success',
                text1: 'Password sented on mail!',
            });
            reset()
            navigation.replace("LoginScreen")
            // Proceed with navigation or update auth state here
        } catch (error: any) {
            console.log(error)
            Toast.show({
                type: 'error',
                text1: error?.message ?? 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <View
            // source={require('../../assets/images/trainbg.jpg')}
            style={styles.bg}
        // resizeMode="cover"
        >
            <View
                // colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)']}
                style={styles.overlay}
            >
                <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>Forget Password</Text>
                    <Text style={styles.subtitle}>Enter Your E-mail</Text>

                    {/* Email field */}
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                            <View style={[styles.field, errors.email && styles.errorField]}>
                                <Icon name="mail" size={20} color={errors.email ? '#e63946' : '#555'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#888"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={value}
                                    onChangeText={onChange}
                                />
                            </View>
                        )}
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

                    {/* Login button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSubmit(onSubmit)}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Submit</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                <Toast />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    bg: { flex: 1, width: null, height: null, backgroundColor: "#004080" },
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        width: width * 0.85,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 24,
        elevation: 8,
    },
    title: { fontSize: 28, fontWeight: '700', color: '#333', textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
    field: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#ccc',
        borderRadius: 8, paddingHorizontal: 12, marginBottom: 10,
    },
    errorField: { borderColor: '#e63946' },
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
    errorText: { color: '#e63946', marginBottom: 8, marginLeft: 4 },
    button: {
        backgroundColor: '#004080',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
})

export default ResetPassword;
