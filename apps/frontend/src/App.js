import React, { useState, useEffect } from 'react';
import { Map, TileLayer, ScaleControl, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';

import { mpsToMph, metersToFeet, metersToMiles } from './utils/unitConversion';

// CSS
import 'leaflet/dist/leaflet.css';
import './App.css';

// workaround for webpack issue with leaflet images
// https://github.com/PaulLeCam/react-leaflet/issues/255#issuecomment-261904061
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const socket = io(process.env.REACT_APP_IO_SOCKET, {
  path: process.env.REACT_APP_IO_PATH || '/socket.io'
});
const initialLocation = {
  geometry: {
    coordinates: [-122.440629, 37.766945] // San Francisco, CA;
  },
  properties: {}
};

function App() {
  const [socketId, setSocketId] = useState(null);
  const [deviceDetails, setDeviceDetails] = useState({
    currentLocation: initialLocation,
    currentTrip: null,
    completedTrips: [],
  });

  useEffect(() => {
    socket.once('connect', () => setSocketId(socket.id));
  }, [socketId]);

  useEffect(() => {
    socket.once('disconnect', () => setSocketId(null));
  }, [socketId]);

  useEffect(() => {
    socket.once('device-update', payload => {
      setDeviceDetails({
        currentLocation: payload.currentLocation,
        currentTrip: payload.currentTrip,
        completedTrips: deviceDetails.completedTrips.concat(
          payload.completedTrips
        )
      });
    });
  }, [deviceDetails]);

  const { currentLocation, currentTrip, completedTrips } = deviceDetails;

  const center = {
    lat: currentLocation.geometry.coordinates[1],
    lng: currentLocation.geometry.coordinates[0]
  };
  const zoom = 16;

  return (
    <div>
      <header className='header'>
        <h1>TrackU!online</h1>
        {socketId ? (
          <div className='text-success'>Connected to tracking server</div>
        ) : (
          <div className='text-error'>Not connected to tracking server</div>
        )}
      </header>

      <div className='content'>
        <Map className='map content-section' center={center} zoom={zoom}>
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          />
          {currentLocation.properties.timestamp && (
            <Marker position={center}>
              <Popup>
                <div>
                  <strong>Device:</strong>{' '}
                  {currentLocation.properties.device_id}
                </div>
                <div>
                  <strong>Time:</strong> {currentLocation.properties.local_time}
                </div>
              </Popup>
            </Marker>
          )}
          <ScaleControl position='bottomleft' />
        </Map>

        <div className='content-section'>
          <h2>Current Location</h2>
          {currentLocation.properties.timestamp && (
            <div>
              <div>
                <span className='field-label'>Device:</span>{' '}
                {currentLocation.properties.device_id}
              </div>
              <div>
                <span className='field-label'>Battery:</span>{' '}
                {currentLocation.properties.battery_level &&
                  `${(currentLocation.properties.battery_level * 100).toFixed(
                    0
                  )}%`}
              </div>
              <div>
                <span className='field-label'>Battery State:</span>{' '}
                {currentLocation.properties.battery_state}
              </div>
              <div>
                <span className='field-label'>WiFi:</span>{' '}
                {currentLocation.properties.wifi}
              </div>
              <div>
                <span className='field-label'>Date:</span>{' '}
                {currentLocation.properties.local_date}
              </div>
              <div>
                <span className='field-label'>Time:</span>{' '}
                {currentLocation.properties.local_time}
              </div>
              <div>
                <span className='field-label'>Time Zone:</span>{' '}
                {currentLocation.properties.local_time_zone}
              </div>
              <div>
                <span className='field-label'>Speed:</span>{' '}
                {currentLocation.properties.speed &&
                  `${mpsToMph(currentLocation.properties.speed, 1)} mph (${
                    currentLocation.properties.speed
                  } m/s)`}
              </div>
              <div>
                <span className='field-label'>Motion:</span>{' '}
                {currentLocation.properties.motion &&
                  currentLocation.properties.motion.join(', ')}
              </div>
              <div>
                <span className='field-label'>Altitude:</span>{' '}
                {currentLocation.properties.altitude &&
                  `${metersToFeet(
                    currentLocation.properties.altitude,
                    1
                  )} ft (${currentLocation.properties.altitude} m)`}
              </div>
              <div>
                <span className='field-label'>Vertical Accuracy:</span>{' '}
                {currentLocation.properties.vertical_accuracy &&
                  `${metersToFeet(currentLocation.properties.vertical_accuracy, 1)} ft (${currentLocation.properties.vertical_accuracy} m)`}
              </div>
              <div>
                <span className='field-label'>Horizontal Accuracy:</span>{' '}
                {currentLocation.properties.horizontal_accuracy &&
                  `${metersToFeet(
                    currentLocation.properties.horizontal_accuracy,
                    1
                  )} ft (${currentLocation.properties.horizontal_accuracy} m)`}
              </div>
              <div>
                <span className='field-label'>Latitude:</span>{' '}
                {currentLocation.geometry.coordinates[1].toFixed(6)}
              </div>
              <div>
                <span className='field-label'>Longitude:</span>{' '}
                {currentLocation.geometry.coordinates[0].toFixed(6)}
              </div>
            </div>
          )}
        </div>

        <div className='content-section'>
          <h2>Current Trip</h2>
          {currentTrip && (
            <div>
              <div>
                <span className='field-label'>Date:</span>{' '}
                {currentTrip.start_location.properties.local_date}
              </div>
              <div>
                <span className='field-label'>Start Time:</span>{' '}
                {currentTrip.start_location.properties.local_time}
              </div>
              <div>
                <span className='field-label'>Current Time:</span>{' '}
                {currentTrip.current_location.properties.local_time}
              </div>
              <div>
                <span className='field-label'>Duration:</span>{' '}
                {new Date(
                  Date.parse(
                    currentTrip.current_location.properties.timestamp
                  ) -
                    Date.parse(currentTrip.start_location.properties.timestamp)
                )
                  .toISOString()
                  .substr(11, 10)}
              </div>
              <div>
                <span className='field-label'>Distance:</span>{' '}
                {`${metersToMiles(currentTrip.distance, 2)} miles (${(
                  currentTrip.distance / 1000
                ).toFixed(2)} km)`}
              </div>
            </div>
          )}
        </div>

        <div className='content-section'>
          <h2>Completed Trips</h2>
          {completedTrips.map((trip, index) => {
            return (
              <div key={trip.properties.timestamp}>
                <div>
                  <span className='field-label'>Date:</span>{' '}
                  {trip.properties.start_location.properties.local_date}
                </div>
                <div>
                  <span className='field-label'>Start Time:</span>{' '}
                  {trip.properties.start_location.properties.local_time}
                </div>
                <div>
                  <span className='field-label'>End Time:</span>{' '}
                  {trip.properties.end_location.properties.local_time}
                </div>
                <div>
                  <span className='field-label'>Duration:</span>{' '}
                  {new Date(trip.properties.duration * 1000)
                    .toISOString()
                    .substr(11, 10)}
                </div>
                <div>
                  <span className='field-label'>Distance:</span>{' '}
                  {`${metersToMiles(trip.properties.distance, 2)} miles (${(
                    trip.properties.distance / 1000
                  ).toFixed(2)} km)`}
                </div>
                <div>
                  <span className='field-label'>Mode:</span>{' '}
                  {trip.properties.mode}
                </div>
                {index !== completedTrips.length - 1 && <hr />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
