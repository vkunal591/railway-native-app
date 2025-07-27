import React, { useState, useEffect } from 'react';
import {
    FlatList, View, Text, TextInput,
    ActivityIndicator, StyleSheet, Alert,
    TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Fetch, Delete } from '../../utils/apiUtils';
import UserCard from '../../components/common/UserCard';
import { Picker } from '@react-native-picker/picker';

export default function UsersScreen() {
    const [users, setUsers] = useState<any[]>([]);
    const [filter, setFilter] = useState({ page: 1, name: '' });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [total, setTotal] = useState(0);
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    const fetchUsers = async (append = false) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: filter.page.toString(),
                ...(filter.name && { name: filter.name }),
            }).toString();

            const res: any = await Fetch(`/api/auth/user?${params}`);
            const data = res?.data?.users || [];
            const totalItems = res?.data?.pagination?.totalItems || 0;

            setUsers(prev => append ? [...prev, ...data] : data);
            setTotal(totalItems);
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(filter.page > 1);
    }, [filter, isFocused]);

    const loadMore = () => {
        if (!loading && users.length < total) {
            setFilter(f => ({ ...f, page: f.page + 1 }));
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setFilter(f => ({ ...f, page: 1 }));
        await fetchUsers(false);
        setRefreshing(false);
    };

    const confirmDelete = (user: any) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete "${user.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDelete(user) },
            ]
        );
    };

    const handleDelete = async (user: any) => {
        try {
            const res: any = await Delete(`/api/users/${user._id}`, {}, {}, 5000);
            if (!res.success) throw new Error('Deletion failed');
            setUsers(prev => prev.filter(u => u._id !== user._id));
            Toast.show({ type: 'success', text1: 'User deleted' });
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message });
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <UserCard
            user={item}
            onEdit={(u) => navigation.navigate('UserFormScreen', { userId: u._id })}
            onDelete={confirmDelete}
        />
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Users</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('UserFormScreen')}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                placeholder="Search by name"
                placeholderTextColor="gray"
                value={filter.name}
                onChangeText={text => setFilter(f => ({ ...f, name: text, page: 1 }))}
                style={styles.input}
            />

            {loading && users.length === 0 ? (
                <ActivityIndicator size="large" />
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={u => u._id}
                    renderItem={renderItem}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListFooterComponent={loading && users.length > 0 ? <ActivityIndicator /> : null}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
    },
    title: { fontSize: 20, fontWeight: 'bold' },
    addButton: {
        backgroundColor: '#003891', borderRadius: 10,
        paddingHorizontal: 15, paddingVertical: 5,
    },
    addButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    input: {
        backgroundColor: '#fafafa', borderWidth: 1, borderColor: 'gray',
        height: 40, borderRadius: 6, paddingHorizontal: 12, marginBottom: 12,
        color: 'black',
    },
});
