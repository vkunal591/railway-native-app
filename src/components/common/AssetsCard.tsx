import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icons from 'react-native-vector-icons/Ionicons';
import { ImagePath } from '../../constants/ImagePath'; // fallback image path

const AssetCard = ({ asset, onEdit, onDelete }: any) => {
    const image = asset?.image?.[0]; // assuming image is a URL or path
    console.log(asset)
    return (
        <View style={styles.card}>
            <Image
                source={image ? { uri: image } : ImagePath.train}
                style={styles.image}
                resizeMode="cover"
            />

            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.label}>Asset ID:</Text>
                    <Text style={styles.value}>{asset?.assetId}</Text>
                </View>

                {asset?.remarks ? (
                    <View style={styles.row}>
                        <Text style={styles.label}>Remarks:</Text>
                        <Text style={styles.value}>{asset?.remarks}</Text>
                    </View>
                ) : null}

                <View style={styles.row}>
                    <Text style={styles.label}>Location:</Text>
                    <Text style={styles.value}>
                        {asset?.latitude.toFixed(5)}, {asset?.longitude.toFixed(5)}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Created:</Text>
                    <Text style={styles.value}>
                        {new Date(asset?.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => onEdit(asset)} style={styles.iconBtn}>
                        <Icons name="create-outline" size={20} color="#2c3e50" />
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => onDelete(asset)} style={styles.iconBtn}>
                        <Icons name="trash-outline" size={20} color="#e74c3c" />
                        <Text style={[styles.actionText, { color: '#e74c3c' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default AssetCard;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 12,
        borderRadius: 10,
        elevation: 3,
        overflow: 'hidden',
    },
    image: {
        width: 150,
        height: "auto",
        backgroundColor: '#f0f0f0',
    },
    content: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-between',
    },
    row: {
        marginBottom: 4,
    },
    label: {
        fontWeight: 'bold',
        fontSize: 13,
        color: '#555',
    },
    value: {
        fontSize: 14,
        color: '#333',
        marginLeft: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
        alignItems: 'center',
    },
    iconBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
});
