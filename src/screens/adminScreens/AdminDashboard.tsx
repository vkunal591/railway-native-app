import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Fetch } from '../../utils/apiUtils';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [mapData, setMapData] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [summaryRes, locationRes]: any = await Promise.all([
        Fetch('/api/analytics/summary'),
        Fetch('/api/analytics/location-distribution'),
      ]);
      console.log(summaryRes, locationRes);
      setStats(summaryRes?.data);
      setMapData(locationRes?.data);
    } catch (err: any) {
      // console.error('Dashboard Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;

  const pieData: any = Object.entries(stats?.statusCount || {}).map(([key, value]) => ({
    value,
    label: key.replace(/_/g, ' ').toUpperCase(),
    color:
      key === 'in_progress' ? '#2196f3' :
      key === 'completed' ? '#4caf50' :
      key === 'on_hold' ? '#ff9800' :
      key === 'cancelled' ? '#f44336' :
      '#9e9e9e',
  }));

  const totalProjects = pieData.reduce((sum: number, item: any) => sum + item.value, 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Admin Dashboard</Text>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Projects</Text>
          <Text style={styles.cardValue}>{stats?.total}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Budget</Text>
          <Text style={styles.cardValue}>₹{stats?.totalBudget?.toLocaleString()}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Average Budget</Text>
          <Text style={styles.cardValue}>₹{stats?.averageBudget?.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Project Status Breakdown</Text>
        <PieChart
          data={pieData}
          donut
          radius={90}
          innerRadius={50}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Total</Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#3f51b5' }}>
                {totalProjects}
              </Text>
            </View>
          )}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Project Trends</Text>
        <LineChart
          data={(stats?.monthlyTrend || []).map((item: any) => ({
            value: item?.count,
            label: item?.month
          }))}
          color="#3f51b5"
          areaChart
          curved
          thickness={3}
          yAxisTextStyle={{ color: '#888' }}
          hideDataPoints
          isAnimated
        />
      </View>

      <View style={styles.mapContainer}>
        <Text style={styles.chartTitle}>Project Locations (By Country)</Text>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 20,
            longitude: 0,
            latitudeDelta: 90,
            longitudeDelta: 180,
          }}
        >
          {mapData?.map((c: any, i: any) => (
            <Marker
              key={i}
              coordinate={{ latitude: c?.lat, longitude: c?.lng }}
              title={`${c.country} (${c?.count} projects)`}
              description={`Projects in ${c?.country}`}
            />
          ))}
        </MapView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#222' },

  cardRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  card: {
    width: '32%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 3,
  },
  cardLabel: { fontSize: 13, color: '#777' },
  cardValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },

  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, paddingHorizontal: 10, paddingTop: 4 },

  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: "white",
    marginBottom: 30,
  },
  map: { flex: 1 },
});
