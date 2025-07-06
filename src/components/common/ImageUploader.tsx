// components/ImageUploader.js
import React, { useState } from 'react';
import { View, Button, Image, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const ImageUploader = ({ onImages }: any) => {
    const [images, setImages] = useState<any>([]);

    const pickImages = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                selectionLimit: 5,
            },
            (response: any) => {
                if (response.didCancel || response.errorCode) return;

                const selected = response.assets.map((asset: any) => ({
                    uri: asset.uri,
                    name: asset.fileName,
                    type: asset.type,
                }));

                const all = [...images, ...selected];
                setImages(all);
                onImages(all);
            }
        );
    };

    const removeImage = (uriToRemove: any) => {
        const updated = images.filter((img:any) => img.uri !== uriToRemove);
        setImages(updated);
        onImages(updated);
    };

    return (
        <View style={styles.container}>
            <Button title="Upload Images" onPress={pickImages} />
            <FlatList
                horizontal
                data={images}
                keyExtractor={(item) => item.uri}
                renderItem={({ item }) => (
                    <View style={styles.imageBox}>
                        <Image source={{ uri: item.uri }} style={styles.image} />
                        <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(item.uri)}>
                            <Text style={styles.removeText}>×</Text>
                        </TouchableOpacity>
                    </View>
                )}
                style={{ marginTop: 10 }}
            />
        </View>
    );
};

export default ImageUploader;

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    imageBox: {
        position: 'relative',
        marginRight: 8,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 6,
    },
    removeBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#e74c3c',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
