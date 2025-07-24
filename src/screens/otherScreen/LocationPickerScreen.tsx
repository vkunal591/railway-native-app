import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Alert, ActivityIndicator, Platform,
  SafeAreaView, TextInput, FlatList
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { MapType, PROVIDER_GOOGLE, Marker, Circle } from 'react-native-maps';
import { getCurrentLocationWithAddress } from '../../utils/locationService';
import { LocationContext } from '../../context/LocationContextProvider';
import { GEOAPIFY_API_KEY } from '@env';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LAT_DELTA = 0.01;
const LNG_DELTA = LAT_DELTA * ASPECT_RATIO;

export default function EnhancedMapScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { markerStart, setMarkerStart, markerEnd, setMarkerEnd } = useContext(LocationContext);
  const [region, setRegion] = useState({ latitude: 28.6139, longitude: 77.2088, latitudeDelta: LAT_DELTA, longitudeDelta: LNG_DELTA });
  const [mapType, setMapType] = useState<MapType>('standard');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [focus, setFocus] = useState<'start' | 'end'>('start');
  const [liveTracking, setLiveTracking] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => { getCurrntLocation(); return clearWatch; }, []);
  useEffect(() => liveTracking ? startWatch() : clearWatch(), [liveTracking, focus]);

  const getCurrntLocation = async () => {
    try {
      setLoadingLocation(true);
      const { latitude, longitude } = await getCurrentLocationWithAddress();
      setRegion({ latitude, longitude, latitudeDelta: LAT_DELTA, longitudeDelta: LNG_DELTA });
      setCurrentLocation({ latitude, longitude });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLocation(false);
    }
  };

  const startWatch = () => {
    watchId.current = Geolocation.watchPosition(pos => {
      const { latitude, longitude } = pos.coords;
      setCurrentLocation({ latitude, longitude });
      setRegion(r => ({ ...r, latitude, longitude }));
      focus === 'start' ? setMarkerStart({ latitude, longitude }) : setMarkerEnd({ latitude, longitude });
    });
  };
  const clearWatch = () => { if (watchId.current !== null) Geolocation.clearWatch(watchId.current); watchId.current = null; };

  const fetchSuggestions = async (text: string) => {
    setQuery(text);
    if (text.length < 3) return setSuggestions([]);
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&limit=5&apiKey=${GEOAPIFY_API_KEY}`
      );
      console.log(res)
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (e) {
      console.error('Geoapify autocomplete error:', e);
    }
  };

  const handleSelect = (item: any) => {
    const { lat, lon } = item.properties;
    const coord = { latitude: lat, longitude: lon, latitudeDelta: LAT_DELTA, longitudeDelta: LNG_DELTA };
    setRegion(coord); // center map
    focus === 'start' ? setMarkerStart(coord) : setMarkerEnd(coord);
    setQuery(item.properties.formatted); // update input
    setSuggestions([]);
  };

  const centerMapOnCurrentLocation = async () => {
    await getCurrntLocation();
    if (!currentLocation) return Alert.alert('Location not available');
    setRegion({ ...currentLocation, latitudeDelta: LAT_DELTA, longitudeDelta: LNG_DELTA });
  };

  const resetMarkers = () => { setMarkerStart(null); setMarkerEnd(null); };
  const confirmSelection = () => {
    if (!markerStart && !markerEnd) {
      return Alert.alert('Selection Required', 'Set start and/or end.');
    }

    Alert.alert(
      'Confirm',
      `Start: ${markerStart ? `${markerStart.latitude.toFixed(4)},${markerStart.longitude.toFixed(4)}` : 'N/A'}\nEnd: ${markerEnd ? `${markerEnd.latitude.toFixed(4)},${markerEnd.longitude.toFixed(4)}` : 'N/A'}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'OK',
          onPress: () => {
            if (route.params?.onPick) {
              route.params.onPick({
                start: markerStart,
                end: markerEnd,
              });
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Geoapify Search Input */}
      <View style={styles.searchContainer}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "gray", overflow: "hidden" }} >
          <TextInput
            value={query}
            onChangeText={fetchSuggestions}
            placeholder="Search location..."
            style={styles.searchInput}
          />
          <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]) }}>
            <Icon name='close' color={""} size={22} />
          </TouchableOpacity>
        </View>
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={item => item.properties.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelect(item)} style={styles.suggestion}>
                <Text>{item.properties.formatted}</Text>
              </TouchableOpacity>
            )}
            style={styles.dropdown}
          />
        )}
      </View>

      <View style={styles.mapTypeSelector}>
        {['standard', 'satellite', 'hybrid'].map(type => (
          <TouchableOpacity key={type} style={[styles.mapTypeBtn, mapType === type && styles.mapTypeBtnActive]} onPress={() => setMapType(type as MapType)}>
            <Text style={[styles.mapTypeText, mapType === type && styles.mapTypeTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={region} mapType={mapType} showsUserLocation onRegionChangeComplete={setRegion}>
        {markerStart && <Marker coordinate={markerStart} pinColor="green" draggable onDragEnd={e => setMarkerStart(e.nativeEvent.coordinate)} title="Start" />}
        {markerEnd && <Marker coordinate={markerEnd} pinColor="red" draggable onDragEnd={e => setMarkerEnd(e.nativeEvent.coordinate)} title="End" />}
        {currentLocation && <Circle center={currentLocation} radius={50} fillColor="rgba(0,150,255,0.2)" strokeColor="rgba(0,150,255,0.5)" />}
      </MapView>

      <View style={styles.controlsContainer}>
        <View style={styles.selectionButtons}>
          {(['start', 'end'] as ('start' | 'end')[]).map(btn => (
            <TouchableOpacity key={btn} style={[styles.selectionBtn, focus === btn && styles.selectionBtnActive]} onPress={() => setFocus(btn)}>
              <Icon name={btn === 'start' ? 'play' : 'stop'} size={20} color={focus === btn ? '#fff' : '#007AFF'} />
              <Text style={[styles.selectionBtnText, focus === btn && styles.selectionBtnTextActive]}>{btn.charAt(0).toUpperCase() + btn.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.liveToggleBtn, liveTracking ? styles.liveOn : styles.liveOff]} onPress={() => setLiveTracking(!liveTracking)}>
            <Icon name={liveTracking ? 'walk-outline' : 'walk'} size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.liveToggleText}>{liveTracking ? 'Tracking Live' : 'Start Tracking'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.liveToggleBtn, { backgroundColor: "#fff", borderWidth: 1, borderColor: "#007AFF", gap: 2 }]} onPress={centerMapOnCurrentLocation}>
            <Icon name="navigate" size={22} color="#007AFF" />
            <Text style={styles.actionBtnText}>My Location</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.liveOn, { borderRadius: 50, width: "48%", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12 }]} onPress={resetMarkers}>
            <Icon name="refresh" size={22} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: "48%", height: "100%", borderRadius: 100, borderWidth: 1, borderColor: "#007AFF", flexDirection: "row", alignItems: "center", justifyContent: "center" }} onPress={confirmSelection}>
            <Icon name="checkmark" size={22} color="#007AFF" />
            <Text style={styles.confirmBtnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loadingLocation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ color: '#007AFF', marginTop: 10 }}>Fetching location...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  mapTypeSelector: {
    position: 'absolute',
    width: "auto",
    top: Platform.OS === 'ios' ? 110 : 80,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    zIndex: 10,
  },
  mapTypeBtn: {
    marginHorizontal: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  mapTypeBtnActive: {
    backgroundColor: '#007AFF',
  },
  mapTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  mapTypeTextActive: {
    color: '#fff',
  },

  map: { flex: 1 },

  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },

  selectionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  selectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#007AFF',
    borderWidth: 1.5,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 10,
  },
  selectionBtnActive: {
    backgroundColor: '#007AFF',
  },
  selectionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  selectionBtnTextActive: {
    color: '#fff',
  },

  liveToggleBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
    marginBottom: 12,
    width: "48%"
  },
  liveOn: {
    backgroundColor: '#d9534f',
  },
  liveOff: {
    backgroundColor: '#5cb85c',
  },
  liveToggleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#007AFF',
    fontWeight: '600',
  },

  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 6,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },

  searchContainer: {
    position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 10, right: 10, zIndex: 20
  },
  searchInput: {
    height: 44, backgroundColor: '#fff', paddingHorizontal: 12, borderRadius: 8, width: "90%"
  },
  dropdown: {
    backgroundColor: '#fff', marginTop: 4, borderRadius: 8, maxHeight: 150, elevation: 2
  },
  suggestion: {
    padding: 10, borderBottomWidth: 1, borderColor: '#eee'
  },
});
