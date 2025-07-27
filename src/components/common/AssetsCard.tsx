import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icons from 'react-native-vector-icons/Ionicons';
import { TokenStorage } from '../../utils/apiUtils';

const AssetCard = ({ asset, onEdit, onDelete, onShowRoute }: any) => {
    const coordinates = asset?.location?.coordinates;
    const formattedLat = coordinates?.[1]?.toFixed(5);
    const formattedLng = coordinates?.[0]?.toFixed(5);


    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = await TokenStorage.getUserData();
                setUserData(user);
                console.log('User data:', user);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const role = userData?.role;


    return (
        <View style={styles.card}>
            <View style={styles.content}>
                <View style={styles.infoRow}>
                    <Icons name="barcode-outline" size={16} color="#2c3e50" />
                    <Text style={styles.label}>Asset ID:</Text>
                    <Text style={styles.value}>{asset?.assetId || 'N/A'}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Icons name="location-outline" size={16} color="#2c3e50" />
                    <Text style={styles.label}>Location:</Text>
                    <Text style={styles.value}>{formattedLat}, {formattedLng}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Icons name="calendar-outline" size={16} color="#2c3e50" />
                    <Text style={styles.label}>Created:</Text>
                    <Text style={styles.value}>
                        {new Date(asset?.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                {role === 'admin' && (
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => onEdit(asset)} style={styles.iconBtn}>
                            <Icons name="create-outline" size={18} color="#2c3e50" />
                            <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => onDelete(asset)} style={styles.iconBtn}>
                            <Icons name="trash-outline" size={18} color="#e74c3c" />
                            <Text style={[styles.actionText, { color: '#e74c3c' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>)}
            </View>

            {/* Floating button to show route */}
            {/* <TouchableOpacity
                style={styles.floatingBtn}
                onPress={() => onShowRoute(asset)}
            >
                <Icons name="map-outline" size={22} color="#fff" />
            </TouchableOpacity> */}
        </View>
    );
};

export default AssetCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        margin: 5,
        borderRadius: 10,
        padding: 16,
        elevation: 3,
        position: 'relative',
    },
    content: {
        flexDirection: 'column',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 13,
        color: '#555',
    },
    value: {
        marginLeft: 4,
        fontSize: 14,
        color: '#333',
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 12,
    },
    iconBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    floatingBtn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#2980b9',
        borderRadius: 30,
        padding: 12,
        elevation: 5,
    },
});
