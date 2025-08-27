import React, { useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Alert,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import Share from 'react-native-share';
import { useRoute } from '@react-navigation/native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDFUazPDEuu1Ei_J7Nhhu-fKNyEcVDG9uQ';

const getStaticMapUrl = (coords: { latitude: number; longitude: number }[]) => {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';

    // Encode path for polyline
    const path = coords.map(c => `${c.latitude},${c.longitude}`).join('|');

    // Markers: start green, end red, others blue
    const markers = coords
        .map((c, i) => {
            const color = 'blue';
            return `markers=color:${color}|${c.latitude},${c.longitude}`;
        })
        .join('&');

    // Build URL
    const url = `${baseUrl}?size=600x400&path=color:0x003891|weight:4|${path}&${markers}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log(url)
    return url;
};

const MapRouteScreen = () => {
    const { params }: any = useRoute();
    const coordinates = params?.coordinates || [];

    const mapRef = useRef<MapView>(null);

    const handleCapturePDF = async () => {
        try {
            if (!coordinates.length) {
                Alert.alert('Error', 'No coordinates to generate map.');
                return;
            }

            const staticMapUrl = getStaticMapUrl(coordinates);

            const locationInfo = coordinates
                .map(
                    (coord: any, index: number) =>
                        `<p><strong>Point ${index + 1}:</strong> Latitude: ${coord.latitude}, Longitude: ${coord.longitude}</p>`
                )
                .join('');

            const html = `
        <html>
        <head>
          <style>
            body { font-family: Arial; padding: 10px; }
            img { width: 100%; height: auto; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Route Map</h1>
          <img src="${staticMapUrl}" />
          <h2>Location Points</h2>
          ${locationInfo}
        </body>
        </html>
      `;

            const pdf = await RNHTMLtoPDF.convert({
                html,
                fileName: `Route_Map_${Date.now()}`,
                base64: false,
            });

            if (pdf.filePath) {
                await Share.open({
                    url: `file://${pdf.filePath}`,
                    type: 'application/pdf',
                    title: 'Share Route Map PDF',
                });
            } else {
                Alert.alert('Error', 'Failed to create PDF file.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An error occurred while exporting PDF.');
        }
    };

    if (!coordinates.length) {
        return (
            <View style={styles.center}>
                <Text>No coordinates available.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: coordinates[0].latitude,
                    longitude: coordinates[0].longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Polyline coordinates={coordinates} strokeColor="red" strokeWidth={4} />
                {coordinates.map((coord: any, index: number) => (
                    <Marker
                        key={index}
                        coordinate={coord}
                        title={`Point ${index + 1}`}
                        description={`Lat: ${coord.latitude}, Lng: ${coord.longitude}`}
                        pinColor={'blue'}
                    />
                ))}
            </MapView>

            <TouchableOpacity style={styles.downloadBtn} onPress={handleCapturePDF}>
                <Text style={styles.downloadText}>📥 Export as PDF</Text>
            </TouchableOpacity>
        </View>
    );
};

export default MapRouteScreen;

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
    downloadBtn: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        backgroundColor: '#003891',
        padding: 12,
        borderRadius: 8,
        elevation: 6,
    },
    downloadText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
