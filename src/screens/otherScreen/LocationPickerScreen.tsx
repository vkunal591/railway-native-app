import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { requestLocationPermission, getCurrentLocation } from '../../utils/locationService';
import { MAPS_API_KEY } from '@env';

// Define navigation and route types
type RootStackParamList = {
  LocationPicker: {
    initial: { start: LocationPoint | null; end: LocationPoint | null };
    onPick: (locations: { start: LocationPoint | null; end: LocationPoint | null }) => void;
  };
};

type LocationPickerRouteProp = RouteProp<RootStackParamList, 'LocationPicker'>;
type LocationPickerNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface LocationPoint {
  latitude: number;
  longitude: number;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LAT_DELTA = 0.01;
const LNG_DELTA = LAT_DELTA * ASPECT_RATIO;

export default function LocationPickerScreen() {
  const route = useRoute<LocationPickerRouteProp>();
  const navigation = useNavigation<LocationPickerNavigationProp>();
  const { initial = { start: null, end: null }, onPick } = route.params;

  const [focus, setFocus] = useState<'start' | 'end'>('start');
  const [region, setRegion] = useState<Region | null>(null);
  const [markerStart, setMarkerStart] = useState<LocationPoint | null>(initial.start);
  const [markerEnd, setMarkerEnd] = useState<LocationPoint | null>(initial.end);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!MAPS_API_KEY) {
      setApiError('Google Places API key is missing. Please configure it in your environment.');
      return;
    }

    (async () => {
      if (!(await requestLocationPermission())) {
        Alert.alert('Permission Denied', 'Location permission is required to select a location.');
        return;
      }
      try {
        const [longitude, latitude] = await getCurrentLocation();
        setRegion({ latitude, longitude, latitudeDelta: LAT_DELTA, longitudeDelta: LNG_DELTA });
      } catch (e: any) {
        Alert.alert('Error', 'Could not fetch current location.');
        console.warn(e);
      }
    })();
  }, []);

  const onPlaceSelect = (_: any, details: any) => {
    if (!details?.geometry?.location) {
      Alert.alert('Error', 'Invalid location selected.');
      return;
    }
    const { lat, lng } = details.geometry.location;
    const point: LocationPoint = { latitude: lat, longitude: lng };
    if (focus === 'start') {
      setMarkerStart(point);
    } else {
      setMarkerEnd(point);
    }
    setRegion({ latitude: lat, longitude: lng, latitudeDelta: LAT_DELTA, longitudeDelta: LNG_DELTA });
  };

  const confirm = () => {
    if (!markerStart && !markerEnd) {
      Alert.alert('Error', 'Please select at least one location.');
      return;
    }
    onPick({ start: markerStart, end: markerEnd });
    navigation.goBack();
  };

  if (apiError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{apiError}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder={`Search ${focus} location`}
        fetchDetails={true}
        onPress={onPlaceSelect}
        onFail={(error) => {
          setApiError('Failed to load places. Please check your API key or network.');
          console.error('GooglePlacesAutocomplete error:', error);
        }}
        query={{
          key: MAPS_API_KEY,
          language: 'en',
          types: 'geocode', // Restrict to geocoding results
        }}
        styles={{ container: styles.autocompleteContainer, listView: styles.autocompleteList }}
        debounce={200} // Reduce API calls
        enablePoweredByContainer={false} // Hide Google logo
      />

      {region && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {markerStart && (
            <Marker
              coordinate={markerStart}
              draggable
              pinColor="green"
              onDragEnd={(e) => setMarkerStart(e.nativeEvent.coordinate)}
            />
          )}
          {markerEnd && (
            <Marker
              coordinate={markerEnd}
              draggable
              pinColor="red"
              onDragEnd={(e) => setMarkerEnd(e.nativeEvent.coordinate)}
            />
          )}
        </MapView>
      )}

      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={() => setFocus('start')}
          style={[styles.btn, focus === 'start' && styles.focus]}
        >
          <Text style={styles.btnText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFocus('end')}
          style={[styles.btn, focus === 'end' && styles.focus]}
        >
          <Text style={styles.btnText}>End</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirm} style={styles.btn}>
          <Text style={styles.btnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#FF3B30', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  autocompleteContainer: { position: 'absolute', width: '100%', zIndex: 1 },
  autocompleteList: { backgroundColor: 'white' },
  map: { flex: 1 },
  toolbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 5, minWidth: 80, alignItems: 'center' },
  focus: { backgroundColor: '#005BB5' },
  btnText: { color: 'white', fontWeight: '600' },
});