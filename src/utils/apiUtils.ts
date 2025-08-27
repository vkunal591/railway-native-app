import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, IMAGE_BASE_URL } from "@env"



export const IMAGE_URL = IMAGE_BASE_URL;
// Define API base URL
export const BASE_URL = 'https://rail.silkindia.co.in';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 5000, // Default timeout in milliseconds
});

// Axios request interceptor for Authorization
api.interceptors.request.use(
    async config => {
        try {
            const token = await TokenStorage.getToken();
            if (token) config.headers['Authorization'] = `Bearer ${token}`;
        } catch (error) {
            console.log('Error retrieving token from AsyncStorage:', error);
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    },
);

// Helper function to make Axios requests
const request = async <T>(
    config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
        () => controller.abort(),
        config.timeout || 10000,
    );

    try {
        // Handle multipart form data
        if (config.data instanceof FormData) {
            config.headers = {
                ...config.headers,
                'Content-Type': 'multipart/form-data',
            };
        }

        const response = await api.request({
            ...config,
            url: BASE_URL + config.url,
            signal: controller.signal,
        });
        console.log("response", "res")
        if (response.data.code === 200) {
            const token = response?.data?.tokan || response?.data?.data?.tokan;
            if (token) await TokenStorage.setToken(token);
        }

        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.log(error)
        const response = error?.response?.data;
        throw response;
    }
};

// Fetch utility function
export const Fetch = async <T>(
    url: string,
    params?: Record<string, unknown>,
    timeout?: number,
): Promise<T> => {
    console.log(url, params)
    try {
        const response = await request<T>({
            method: 'GET',
            url,
            params,
            timeout,
        });
        console.log(response.data)
        return response.data;
    } catch (error: unknown) {
        throw error;
    }
};

// Post utility function
export const Post = async <T>(
    url: string,
    data: Record<string, unknown> | FormData,
    timeout?: number,
): Promise<T> => {
    console.log(API_BASE_URL, url, data, timeout)
    try {
        const response = await request<T>({
            method: 'POST',
            url,
            data,
            timeout,
        });
        console.log("response")
        return response.data;
    } catch (error: unknown) {
        console.log(error, "ppst error")
        throw error;
    }
};

// Put utility function
export const Put = async <T>(
    url: string,
    data: Record<string, unknown> | FormData,
    timeout?: number,
): Promise<T> => {
    console.log(url, data)
    try {
        const response = await request<T>({
            method: 'PUT',
            url,
            data,
            timeout,
        });
        return response.data;
    } catch (error: unknown) {
        throw error;
    }
};

// Patch utility function
export const Patch = async <T>(
    url: string,
    data: Record<string, unknown> | FormData,
    timeout?: number,
): Promise<T> => {
    console.log(url, data)
    try {
        const response = await request<T>({
            method: 'PATCH',
            url,
            data,
            timeout,
        });
        return response.data;
    } catch (error: unknown) {
        throw error;
    }
};

// Delete utility function
export const Delete = async <T>(
    url: string,
    data?: Record<string, unknown>,
    params?: Record<string, unknown>,
    timeout?: number,
): Promise<T> => {
    try {
        const response = await request<T>({
            method: 'DELETE',
            url,
            data,
            params,
            timeout,
        });
        return response.data;
    } catch (error: unknown) {
        throw error;
    }
};

export const TokenStorage = {
    // Store token
    setToken: async (token: string): Promise<void> => {
        try {
            await AsyncStorage.setItem('token', token);
        } catch (error) {
            console.error('Error storing token:', error);
            throw error;
        }
    },

    setUserData: async (userData: string): Promise<void> => {
        try {
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.error('Error storing user data:', error);
            throw error;
        }
    },

    setUserRole: async (role: string): Promise<void> => {
        try {
            await AsyncStorage.setItem('role', JSON.stringify(role));
        } catch (error) {
            console.error('Error storing user role:', error);
            throw error;
        }
    },

    getUserData: async (): Promise<string | null> => {
        try {
            const user: any = await AsyncStorage.getItem('userData');
            return JSON.parse(user)
        } catch (error) {
            console.error('Error storing user data:', error);
            throw error;
        }
    },


    getUserRole: async (): Promise<string | null> => {
        try {
            const role: any = await AsyncStorage.getItem('role');
            return JSON.parse(role)
        } catch (error) {
            console.error('Error storing user data:', error);
            throw error;
        }
    },

    // Get token
    getToken: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem('token');
        } catch (error) {
            console.error('Error retrieving token:', error);
            return null;
        }
    },

    // Remove token
    removeToken: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem('token');
        } catch (error) {
            console.error('Error removing token:', error);
            throw error;
        }
    },

    removeUser: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem('userData');
        } catch (error) {
            console.error('Error removing user:', error);
            throw error;
        }
    },

    removeRole: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem('role');
        } catch (error) {
            console.error('Error removing role:', error);
            throw error;
        }
    },


    // Clear all storage
    clearAll: async (): Promise<void> => {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Error clearing AsyncStorage:', error);
            throw error;
        }
    },
};