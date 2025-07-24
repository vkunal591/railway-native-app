// context/LocationContext.tsx
import React, { createContext, useEffect, useState, ReactNode } from 'react';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import { getCurrentLocationWithAddress } from '../utils/locationService';

type LocationType = {
  latitude: number;
  longitude: number;
  address: any
};

type LocationContextType = {
  location: LocationType | null;
  error: string | null;
  getCurrentLocation: () => any;
  markerStart: any,
  setMarkerStart: any,
  markerEnd: any,
  setMarkerEnd: any
};

export const LocationContext = createContext<LocationContextType>({
  location: null,
  error: null,
  getCurrentLocation: () => { },
  markerStart: null,
  setMarkerStart: null,
  markerEnd: null,
  setMarkerEnd: null
});

type Props = {
  children: ReactNode;
};

interface LocationPoint {
  latitude: number;
  longitude: number;
}

export const LocationProvider = ({ children }: Props) => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [markerStart, setMarkerStart] = useState<LocationPoint | null>(null);
  const [markerEnd, setMarkerEnd] = useState<LocationPoint | null>(null);
  const [error, setError] = useState<string | null>(null);


  const getCurrentLocation = async () => {
    const { latitude, longitude, address } = await getCurrentLocationWithAddress()
    console.log(latitude, longitude, address)
    setLocation({ latitude, longitude, address });
    return { latitude, longitude, address }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ location, error, getCurrentLocation, markerStart, setMarkerStart, markerEnd, setMarkerEnd }}>
      {children}
    </LocationContext.Provider>
  );
};
