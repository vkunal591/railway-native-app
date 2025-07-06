import React, { useState, useEffect } from 'react';
import {
    FlatList, View, Text, TextInput, Button, ActivityIndicator, StyleSheet, Platform,
    TouchableOpacity
} from 'react-native';
// import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Toast from 'react-native-toast-message';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import ProjectCard from '../../components/common/ProjectCard';
import { Delete, Fetch } from '../../utils/apiUtils';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AssetCard from '../../components/common/AssetsCard';

export default function TrackingScreen() {
    const [trackings, setTrackingsScreen] = useState([]);
    const [filter, setFilter] = useState<any>({
        page: 1,
        title: '',
        status: '',
        startDate: '',
        endDate: '',
    });
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    const fetchTrackingScreen = async (append = false) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filter).toString();
            const res: any = await Fetch(`/api/assets`);
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
    }, [filter, isFocused]);

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

            <Text style={styles.label}>Status</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={filter.status}
                    onValueChange={(value) => setFilter((f: any) => ({ ...f, status: value, page: 1 }))}
                >
                    <Picker.Item label="All" value="" />
                    <Picker.Item label="Not Started" value="not_started" />
                    <Picker.Item label="In Progress" value="in_progress" />
                    <Picker.Item label="On Hold" value="on_hold" />
                    <Picker.Item label="Completed" value="completed" />
                    <Picker.Item label="Cancelled" value="cancelled" />
                </Picker>
            </View>
            <TextInput
                placeholder="🔍 Search by title"
                value={filter.title}
                onChangeText={text => setFilter((f: any) => ({ ...f, title: text, page: 1 }))}
                style={styles.input}
            />

            <View style={styles.dateRow}>
                <Text style={{ marginRight: "auto" }}>Filter By Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                    <Text style={styles.dateButtonText}>{filter.startDate || 'Start Date'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                    <Text style={styles.dateButtonText}>{filter.endDate || 'End Date'}</Text>
                </TouchableOpacity>
            </View>
            {showStartPicker && (
                <DateTimePicker
                    value={filter.startDate ? new Date(filter.startDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, date) => {
                        setShowStartPicker(false);
                        if (date) {
                            setFilter(f => ({ ...f, startDate: date.toISOString().split('T')[0], page: 1 }));
                        }
                    }}
                />
            )}

            {showEndPicker && (
                <DateTimePicker
                    value={filter.endDate ? new Date(filter.endDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, date) => {
                        setShowEndPicker(false);
                        if (date) {
                            setFilter(f => ({ ...f, endDate: date.toISOString().split('T')[0], page: 1 }));
                        }
                    }}
                />
            )}

            <TouchableOpacity style={{ width: "100%", padding: 10, marginVertical: 10, backgroundColor: "skyblue", borderRadius: 10 }} onPress={() => navigation.navigate('TrackingFromScreen')} >
                <Text style={{ color: "#fff", fontWeight: 700, textAlign: "center" }}>
                    Add New Tracker
                </Text>
            </TouchableOpacity>

            {loading && trackings.length === 0 ? (
                <ActivityIndicator />
                // <SkeletonPlaceholder>
                //   <SkeletonPlaceholder.Item height={100} margin={10} />
                // </SkeletonPlaceholder>
            ) : (
                <FlatList
                    data={trackings}
                    keyExtractor={(p: any) => p._id}
                    renderItem={({item}) => {
                        console.log(item,"efedfe")
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
        overflow: 'hidden',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center",
        marginVertical: 10,
        paddingHorizontal: 20,
        width: "100%",
        // backgroundColor: "#000"
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
});
