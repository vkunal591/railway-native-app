import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker, { Image as ImagePickerImage } from 'react-native-image-crop-picker';

interface Image {
  uri: string;
  name: string;
  type: string;
}

interface ImageUploaderProps {
  images: Image[];
  onImages: (imgs: Image[]) => void;
  max?: number;
}

export default function ImageUploader({ images, onImages, max = 10 }: ImageUploaderProps) {
  const [localImages, setLocalImages] = useState<Image[]>(images);

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const pickImages = async () => {
    try {
      const res = await ImagePicker.openPicker({
        multiple: true,
        mediaType: 'photo',
        maxFiles: max,
      });

      const selected: Image[] = res.map((img: ImagePickerImage) => ({
        uri: img.path,
        name: img.filename || `photo_${Date.now()}.jpg`,
        type: img.mime,
      }));

      const all = [...localImages, ...selected].slice(0, max);
      setLocalImages(all);
      onImages(all);
    } catch (e: any) {
      if (e.message !== 'User cancelled image selection') {
        Alert.alert('Error', e.message || 'Could not pick image.');
      }
    }
  };

  const removeImage = (index: number) => {
    const updated = [...localImages];
    updated.splice(index, 1);
    setLocalImages(updated);
    onImages(updated);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {localImages && localImages?.map((img, idx) => (
          <View key={idx} style={styles.imageWrapper}>
            <Image source={{ uri: img.uri }} style={styles.image} />
            <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(idx)}>
              <Icon name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}

        {localImages && localImages?.length < max && (
          <TouchableOpacity style={styles.addButton} onPress={pickImages}>
            <Icon name="add" size={30} color="#007AFF" />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingVertical: 10 },
  imageWrapper: {
    marginRight: 10,
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: { width: 80, height: 80, borderRadius: 8 },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 1,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: { fontSize: 12, color: '#007AFF' },
});