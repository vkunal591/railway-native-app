import React, { useState, useEffect } from 'react';
import {
    FlatList, View, Text, TextInput, Button, ActivityIndicator, StyleSheet, Platform,
    TouchableOpacity
} from 'react-native';
// import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Toast from 'react-native-toast-message';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import ProjectCard from '../../components/common/ProjectCard';
import { Delete, Fetch } from '../../utils/apiUtils';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AssetCard from '../../components/common/AssetsCard';

export default function TrackingScreen() {
    const route = useRoute()
    const { projectId }: any = route.params;
    const [trackings, setTrackingsScreen] = useState([]);
    const [filter, setFilter] = useState<any>({
        page: 1,
        project: projectId,
        status: '',
        startDate: '',
        endDate: '',
    });
    console.warn(filter)
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    const fetchTrackingScreen = async (append = false) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filter).toString();
            const res: any = await Fetch(`/api/assets`, filter);
            console.log(res?.data?.result)
            const data = res?.data?.result;
            const total = res?.data?.pagination?.totalItems;
            setTrackingsScreen(prev => append ? [...prev, ...data] : data);
            setTotal(total);
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrackingScreen();
    }, [filter, isFocused, projectId]);

    const loadMore = () => {
        if (trackings.length < total) {
            setFilter((f: any) => ({ ...f, page: f.page + 1 }));
        }
    };

    const handleDelete = async (project: any) => {
        try {
            const res: any = await Delete(`/api/assets/${project._id}`, {}, {}, 5000);
            if (!res.success) throw new Error('Delete failed');
            setTrackingsScreen(prev => prev.filter((p: any) => p._id !== project._id));
            Toast.show({ type: 'success', text1: 'Project deleted' });
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message });
        }
    };

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: "space-between" }}>
                <Text style={{ fontSize: 20, fontWeight: "600" }}>
                    All Assets Tracking Points
                </Text>
                <TouchableOpacity
                    style={{ padding: 5, marginVertical: 5, paddingHorizontal: 15, backgroundColor: "#003891", borderRadius: 10 }}
                    onPress={() => navigation.navigate('TrackingFromScreen', { projectId })}
                >
                    <Text style={{ color: "#fff", fontWeight: 700, textAlign: "center", fontSize: 20 }}>
                        +
                    </Text>
                </TouchableOpacity>
            </View>


            {loading && trackings.length === 0 ? (
                <ActivityIndicator />
            ) : (
                <FlatList
                    data={trackings}
                    keyExtractor={(p: any) => p._id}
                    renderItem={({ item }) => {
                        return (
                            <AssetCard
                                asset={item}
                                onEdit={() => navigation.navigate('TrackingFromScreen', { assetId: item._id })}
                                onDelete={() => handleDelete(item)}
                            />
                        )
                    }}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loading && trackings.length > 0 ? <ActivityIndicator /> : null}
                />
            )}

            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() =>
                    navigation.navigate('MapRouteScreen', {
                        coordinates: trackings.map((asset: any) => ({
                            latitude: asset.location.coordinates[1],
                            longitude: asset.location.coordinates[0],
                        })),
                    })
                }
            >
                <Text style={styles.floatingButtonText}>🗺️</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 12, flex: 1, backgroundColor: '#fff' },
    input: {
        backgroundColor: '#f3f3f3',
        paddingHorizontal: 12,
        marginBottom: 8,
        height: 40,
        borderRadius: 6,
    },
    label: { fontWeight: 'bold', marginBottom: 4 },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginBottom: 8,
        paddingHorizontal: 5,
        // overflow: 'hidden',
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center",
        marginVertical: 10,
        paddingHorizontal: 20,
        width: "100%",
        // backgroundColor: "#000"
        display: "none"
    },
    dateButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 5,
        paddingHorizontal: 5,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    dateButtonText: {
        color: '#0f0f0f',
        fontSize: 16,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#003891',
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
    },
    floatingButtonText: {
        color: '#fff',
        fontSize: 26,
    },

});
