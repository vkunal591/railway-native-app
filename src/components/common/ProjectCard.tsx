import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icons from 'react-native-vector-icons/Ionicons';
import { TokenStorage } from '../../utils/apiUtils';

const ProjectCard = ({ project, onEdit, onDelete, onView }: any) => {
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
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

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'not_started':
                return { backgroundColor: '#b0bec5' }; // Gray
            case 'in_progress':
                return { backgroundColor: '#42a5f5' }; // Blue
            case 'on_hold':
                return { backgroundColor: '#ffb300' }; // Amber
            case 'completed':
                return { backgroundColor: '#66bb6a' }; // Green
            case 'cancelled':
                return { backgroundColor: '#ef5350' }; // Red
            default:
                return { backgroundColor: '#cfd8dc' }; // Light gray fallback
        }
    };


    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onView(project)}
            style={styles.card}
        >
            <View style={styles.content}>
                <View style={styles.infoRow}>
                    <Icons name="document-text-outline" size={16} color="#2c3e50" />
                    <Text style={styles.label}>Title:</Text>
                    <Text style={styles.value}>{project.title}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Icons name="location-outline" size={16} color="#2c3e50" />
                    <Text style={styles.label}>Location:</Text>
                    <Text style={styles.value}>{project.city}, {project.country}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Icons name="pulse-outline" size={16} color="#2c3e50" />
                    <Text style={styles.label}>Status:</Text>
                    <View style={[styles.badge, getStatusBadgeStyle(project.status)]}>
                        <Text style={styles.badgeText}>
                            {project.status.replace(/_/g, ' ')}
                        </Text>
                    </View>
                </View>


                <View style={styles.infoRow}>
                    <Icons name="cash-outline" size={16} color="#2c3e50" />
                    <Text style={styles.label}>Budget:</Text>
                    <Text style={styles.value}>₹{project.budget?.toLocaleString()}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Icons name="calendar-outline" size={16} color="#2c3e50" />
                    <Text style={styles.label}>Dates:</Text>
                    <Text style={styles.value}>{formatDate(project.startDate)} - {formatDate(project.endDate)}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Icons name="people-outline" size={16} color="#2c3e50" />
                    <Text style={styles.label}>Team Members:</Text>
                    <Text style={styles.value}>{project.team?.length || 0}</Text>
                </View>

                {role === 'admin' && (
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => onEdit(project)} style={styles.iconBtn}>
                            <Icons name="create-outline" size={18} color="#2c3e50" />
                            <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => onDelete(project)} style={styles.iconBtn}>
                            <Icons name="trash-outline" size={18} color="#e74c3c" />
                            <Text style={[styles.actionText, { color: '#e74c3c' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>)
                }
            </View>
        </TouchableOpacity >
    );
};

export default ProjectCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 1,
        marginVertical: 8,
        borderRadius: 10,
        padding: 16,
        elevation: 3,
    },
    content: {
        flexDirection: 'column',
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
        minWidth: 110,
    },
    value: {
        marginLeft: 4,
        fontSize: 14,
        color: '#333',
        flexShrink: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 12,
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
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
        textTransform: 'capitalize',
    },

});
