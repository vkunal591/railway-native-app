// components/ProjectCard.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ImagePath } from '../../constants/ImagePath';

const statusColors: any = {
    not_started: '#bdc3c7',
    in_progress: '#3498db',
    on_hold: '#f1c40f',
    completed: '#2ecc71',
    cancelled: '#e74c3c',
};

const ProjectCard = ({ project, onEdit, onDelete }: any) => {
    const mainImage = project.images?.[0];

    return (
        <View style={styles.card}>
            {/* {mainImage ? ( */}
            <Image source={mainImage ? { uri: mainImage } : ImagePath.train} style={styles.image} />
            {/* // ) : (
            //     <View style={[styles.image, styles.imagePlaceholder]}>
            //         <Text style={{ color: '#777' }}>No Image</Text>
            //     </View>
            // )} */}

            <View style={styles.content}>
                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.title}>{project.title}</Text>
                <Text style={styles.date}>
                    {new Date(project.startDate).toLocaleDateString()} →{' '}
                    {new Date(project.endDate).toLocaleDateString()}
                </Text>
                <Text style={[styles.status, { backgroundColor: statusColors[project.status] }]}>
                    {project.status.replace('_', ' ')}
                </Text>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => onEdit(project)}>
                        <Text style={styles.actionBtn}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(project)}>
                        <Text style={[styles.actionBtn, { color: 'red' }]}>Delete</Text>
                    </TouchableOpacity>
                    {/* <Text numberOfLines={1} ellipsizeMode='tail' style={styles.title}>{project.title}</Text> */}
                </View>
            </View>
        </View>
    );
};

export default ProjectCard;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    image: {
        width: 100,
        height: "auto",
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
    },
    content: {
        flex: 1,
        padding: 10,
    },
    title: {
        fontWeight: '600',
        fontSize: 16,
    },
    date: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    status: {
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        color: '#fff',
        fontSize: 12,
        alignSelf: 'flex-start',
    },
    actions: {
        marginTop: 10,
        flexDirection: 'row',
        gap: 16,
    },
    actionBtn: {
        fontWeight: 'bold',
        color: '#3498db',
    },
});
