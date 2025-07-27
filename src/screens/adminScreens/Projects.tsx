import React, { useState, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Delete, Fetch } from '../../utils/apiUtils';
import { Picker } from '@react-native-picker/picker';
import ProjectCard from '../../components/common/ProjectCard';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    page: 1,
    title: '',
    status: '',
  });
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    setFilter(f => ({ ...f, page: 1 })); // Reset to first page
    await fetchProjects(false); // Fetch fresh data
    setRefreshing(false);
  };


  // Fetch projects with optional append for pagination
  const fetchProjects = async (append = false) => {
    setLoading(true);
    try {
      const queryParams: any = {
        page: filter.page,
        ...(filter.title && { title: filter.title }),
        ...(filter.status && { status: filter.status }),
      };

      const params = new URLSearchParams(queryParams).toString();
      const res: any = await Fetch(`/api/projects?${params}`);
      const data = res?.data?.result || [];
      const totalItems = res?.data?.pagination?.totalItems || 0;

      setProjects(prev => (append ? [...prev, ...data] : data));
      setTotal(totalItems);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Fetch on filter/page change or when screen focused
  useEffect(() => {
    fetchProjects(filter.page > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, isFocused]);

  // Load more projects for infinite scroll
  const loadMore = () => {
    if (!loading && projects.length < total) {
      setFilter(f => ({ ...f, page: f.page + 1 }));
    }
  };

  // Confirm before deleting project
  const confirmDelete = (project: any) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(project),
        },
      ]
    );
  };

  // Delete project API call and update list
  const handleDelete = async (project: any) => {
    try {
      const res: any = await Delete(`/api/projects/${project._id}`, {}, {}, 5000);
      if (!res.success) throw new Error('Delete failed');
      setProjects(prev => prev.filter(p => p._id !== project._id));
      Toast.show({ type: 'success', text1: 'Project deleted' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message });
    }
  };

  // Render single ProjectCard
  const renderCard = ({ item }: { item: any }) => (
    <ProjectCard
      project={item}
      onView={p => navigation.navigate('TrackingScreen', { projectId: p._id })}
      onEdit={p => navigation.navigate('ProjectFormScreen', { projectId: p._id })}
      onDelete={confirmDelete}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Projects</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ProjectFormScreen')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={filter.status}
          style={{ color: "#000" }}
          onValueChange={value =>
            setFilter(f => ({ ...f, status: value, page: 1 }))
          }
        >
          <Picker.Item label="All Projects" value="" />
          <Picker.Item label="Not Started" value="not_started" />
          <Picker.Item label="In Progress" value="in_progress" />
          <Picker.Item label="On Hold" value="on_hold" />
          <Picker.Item label="Completed" value="completed" />
          <Picker.Item label="Cancelled" value="cancelled" />
        </Picker>
      </View>

      {/* Search Input */}
      <TextInput
        placeholder="Search by project name"
        value={filter.title}
        placeholderTextColor="gray"
        onChangeText={text => setFilter(f => ({ ...f, title: text, page: 1 }))}
        style={styles.input}
      />

      {/* Project List */}
      {loading && projects.length === 0 ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={p => p._id}
          renderItem={renderCard}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={
            loading && projects.length > 0 ? <ActivityIndicator /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#003891',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  input: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'gray',
    color: 'black',
  },
});
