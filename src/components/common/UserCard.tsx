import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icons from 'react-native-vector-icons/Ionicons';

const getStatusBadgeStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? '#66bb6a' : '#ef5350',
});

export default function UserCard({ user, onEdit, onDelete }: any) {
    return (
        <View style={styles.card}>
            <View style={styles.infoRow}>
                <Icons name="person-circle-outline" size={16} color="#2c3e50" />
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{user.name}</Text>
            </View>

            <View style={styles.infoRow}>
                <Icons name="mail-outline" size={16} color="#2c3e50" />
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{user.email}</Text>
            </View>

            <View style={styles.infoRow}>
                <Icons name="shield-outline" size={16} color="#2c3e50" />
                <Text style={styles.label}>Role:</Text>
                <Text style={styles.value}>{user.role}</Text>
            </View>

            <View style={styles.infoRow}>
                <Icons name="checkmark-circle-outline" size={16} color="#2c3e50" />
                <Text style={styles.label}>Status:</Text>
                <View style={[styles.badge, getStatusBadgeStyle(user.isActive)]}>
                    <Text style={styles.badgeText}>
                        {user.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={() => onEdit(user)} style={styles.iconBtn}>
                    <Icons name="create-outline" size={18} color="#2c3e50" />
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(user)} style={styles.iconBtn}>
                    <Icons name="trash-outline" size={18} color="#e74c3c" />
                    <Text style={[styles.actionText, { color: '#e74c3c' }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        marginVertical: 8,
        marginHorizontal: 0,
        borderRadius: 10,
        padding: 16,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 14,
        color: '#555',
        minWidth: 90,
    },
    value: {
        marginLeft: 4,
        fontSize: 14,
        color: '#333',
        flexShrink: 1,
    },
    badge: {
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 24,
    },
    iconBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
