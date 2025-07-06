import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { Fetch } from '../utils/apiUtils';

const HomeScreen = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res: any = Fetch('/api/projects'); // Replace with your actual API
      console.log(res)
      setData(res.data);
      setFiltered(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleSearch = (text: any) => {
    setSearch(text);
    const filteredData = data.filter((item: any) =>
      item.name.toLowerCase().includes(text.toLowerCase())
    );
    setFiltered(filteredData);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text>{item.description}</Text>
    </View>
  );

  const renderMap = () => (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 37.78825, // Default center
        longitude: -122.4324,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
    >
      {filtered?.map((item: any, index: any) => (
        <Marker
          key={index}
          coordinate={{
            latitude: item.latitude,
            longitude: item.longitude,
          }}
          title={item.name}
          description={item.description}
        />
      ))}
    </MapView>
  );

  return (
    <View style={styles.container}>
      {/* Profile & Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome Back!</Text>
        <Icon name="user-circle" size={30} color="#000" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search items..."
          style={styles.searchInput}
        />
        <TouchableOpacity onPress={() => setShowMap(!showMap)} style={styles.mapToggle}>
          <Icon name={showMap ? 'list' : 'map'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Options (Example only) */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Nearby</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Popular</Text>
        </TouchableOpacity>
      </View>

      {/* Loader */}
      {loading ? (
        <ActivityIndicator size="large" />
      ) : showMap ? (
        renderMap()
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 10,
  },
  mapToggle: {
    marginLeft: 10,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
  },
  filters: {
    flexDirection: 'row',
    marginTop: 10,
  },
  filterBtn: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  filterText: {
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fafafa',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
    marginTop: 10,
  },
});
