import React, { useState } from 'react';
import MapView, { Marker } from 'react-native-maps';

function LocationPicker({ defaultValue, onLocation }: any) {
    const [region, setRegion] = useState({
        latitude: defaultValue?.coordinates[1] || 0,
        longitude: defaultValue?.coordinates[0] || 0,
        latitudeDelta: 0.01, longitudeDelta: 0.01,
    });

    const [marker, setMarker] = useState({
        latitude: region.latitude, longitude: region.longitude
    });

    return (
        <MapView style={{ height: 200 }} region={region}
            onRegionChangeComplete={r => setRegion(r)}>
            <Marker draggable coordinate={marker}
                onDragEnd={e => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setMarker({ latitude, longitude });
                    onLocation({ type: 'Point', coordinates: [longitude, latitude] });
                }}
            />
        </MapView>
    );
}

export default LocationPicker;  