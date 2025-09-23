import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { locationsData } from '../data/locations';
import { createClusters, getClusterSize, getClusterColor } from '../utils/clusterUtils';
import ClusterModal from './ClusterModal';

const MapboxMap = ({ center = { lat: 37.7749, lng: -122.4194 }, zoom = 10, apiKey, showHeatmap = true }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [showClusterModal, setShowClusterModal] = useState(false);

  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_ACCESS_TOKEN_HERE') {
      setError('Mapbox access token is required');
      setIsLoading(false);
      return;
    }

    mapboxgl.accessToken = apiKey;

    if (mapRef.current && !mapInstance.current) {
      try {
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [center.lng, center.lat],
          zoom: zoom,
          attributionControl: false
        });

        mapInstance.current = map;

        map.on('load', () => {
          
          const clustersData = createClusters(locationsData, 0.3);
          setClusters(clustersData);
          
          if (showHeatmap) {
            const geojsonData = {
              type: 'FeatureCollection',
              features: locationsData.map(location => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [location.lng, location.lat]
                },
                properties: {
                  name: location.name,
                  weight: 1
                }
              }))
            };

            map.addSource('heatmap', {
              type: 'geojson',
              data: geojsonData
            });

            map.addLayer({
              id: 'heatmap',
              type: 'heatmap',
              source: 'heatmap',
              maxzoom: 15,
              paint: {
                'heatmap-weight': [
                  'interpolate',
                  ['linear'],
                  ['get', 'weight'],
                  0, 0,
                  1, 1
                ],
                'heatmap-intensity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 0.3,
                  9, 0.8,
                  15, 1.2
                ],
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(0, 255, 0, 0)',
                  0.1, 'rgba(0, 255, 0, 0.2)',
                  0.2, 'rgba(255, 255, 0, 0.4)',
                  0.4, 'rgba(255, 165, 0, 0.6)',
                  0.6, 'rgba(255, 69, 0, 0.8)',
                  0.8, 'rgba(255, 0, 0, 0.9)',
                  1, 'rgba(255, 0, 0, 1)'
                ],
                'heatmap-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 20,
                  9, 40,
                  15, 60
                ],
                'heatmap-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 0.6,
                  9, 0.8,
                  15, 1
                ]
              }
            });
          }

          clustersData.forEach((cluster) => {
            const el = document.createElement('div');
            el.className = 'cluster-marker';
            el.style.width = `${getClusterSize(cluster.count)}px`;
            el.style.height = `${getClusterSize(cluster.count)}px`;
            el.style.borderRadius = '50%';
            el.style.border = `1px solid ${getClusterColor(cluster.count)}`;
            el.style.backgroundColor = 'white';
            el.style.cursor = 'pointer';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            el.style.overflow = 'hidden';

            const img = document.createElement('img');
            img.src = cluster.representativeImage;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';
            el.appendChild(img);


            el.addEventListener('click', () => {
              setSelectedCluster(cluster);
              setShowClusterModal(true);
            });

            new mapboxgl.Marker(el)
              .setLngLat([cluster.center.lng, cluster.center.lat])
              .addTo(map);
          });
          
          setIsLoading(false);
        });

        map.on('error', () => {
          setError('Failed to load map');
          setIsLoading(false);
        });

      } catch (error) {
        setError(error.message);
        setIsLoading(false);
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [center, zoom, apiKey, showHeatmap]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
          <div className="text-center text-red-600">
            <p>Error loading map: {error}</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-3xl"
      />
      <ClusterModal 
        isOpen={showClusterModal}
        onClose={() => setShowClusterModal(false)}
        cluster={selectedCluster}
      />
    </div>
  );
};

export default MapboxMap;
