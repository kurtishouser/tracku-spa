import React, { useState } from 'react';
import { Map, TileLayer, ScaleControl, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';

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

const socket = io(process.env.REACT_APP_IO_SOCKET,
  {path: process.env.REACT_APP_IO_PATH || '/socket.io'}
);
const initialLocation = {
  geometry: {
    coordinates: [-122.440629, 37.766945], // San Francisco, CA;
  },
  properties: {},
}

function App() {
  const [location, setLocation] = useState(initialLocation);
  const [socketId, setSocketId] = useState('');

  const center = { lat: location.geometry.coordinates[1], lng: location.geometry.coordinates[0] };
  const zoom = 14;

  socket.on('connect', () => {
    setSocketId(socket.id);
    socket.on('location-updated', newLocation => {
      setLocation(newLocation);
    });
  });

  socket.on('disconnect', () => {
    setSocketId('');
  })

  return (
    <div>
      <header className="header">
        <h1>TrackU!online</h1>
        {socketId
          ? <div>Connected to tracking server</div>
          : <div className='text-red'>Not connected to tracking server</div>
        }
      </header>

      <div className="content">
        <Map className="map" center={center} zoom={zoom}>
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          />
          <Marker position={center}>
            <Popup>
              <div>Device: { location.properties.device_id }</div>
              <div>Time: { location.properties.timestamp }</div>
            </Popup>
          </Marker>
          <ScaleControl position="bottomleft" />
        </Map>

        <div className='device-details'>
          <div><span className='field-label'>Device:</span> {location.properties.device_id}</div>
          <div><span className='field-label'>Battery (%):</span> {location.properties.battery_level && (location.properties.battery_level * 100).toFixed(2)}</div>
          <div><span className='field-label'>Battery State:</span> {location.properties.battery_state}</div>
          <div><span className='field-label'>WiFi:</span> {location.properties.wifi}</div>
          <div><span className='field-label'>Time:</span> {location.properties.timestamp}</div>
          <div><span className='field-label'>Speed (m/s):</span> {location.properties.speed}</div>
          <div><span className='field-label'>Motion:</span> {location.properties.motion && location.properties.motion.join(', ')}</div>
          <div><span className='field-label'>Altitude (m):</span> {location.properties.altitude}</div>
          <div><span className='field-label'>Vertical Accuracy (m):</span> {location.properties.vertical_accuracy}</div>
          <div><span className='field-label'>Horizontal Accuracy (m):</span> {location.properties.horizontal_accuracy}</div>
          <div><span className='field-label'>Latitude:</span> {location.geometry.coordinates[1].toFixed(6)}</div>
          <div><span className='field-label'>Longitude:</span> {location.geometry.coordinates[0].toFixed(6)}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
