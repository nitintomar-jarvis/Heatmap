import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getClusterSize, getClusterColor } from '../utils/clusterUtils';
import ClusterModal from './ClusterModal';

const MapboxMap = ({ center = { lat: 37.7749, lng: -122.4194 }, zoom = 10, apiKey, showHeatmap = true }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showImageBlips, setShowImageBlips] = useState(true);
  const [clusterMarkers, setClusterMarkers] = useState([]);
  const [showBlipsLoading, setShowBlipsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [geojsonData, setGeojsonData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  const markersByIdRef = useRef(new Map());

  useEffect(() => {
    const loadGeoJSONData = async () => {
      try {
        setDataLoading(true);
        const response = await fetch('/api/geojson');
        if (!response.ok) {
          throw new Error('Failed to load GeoJSON data');
        }
        const data = await response.json();
        setGeojsonData(data);
        setDataLoading(false);
      } catch (error) {
        console.error('Error loading GeoJSON data:', error);
        setError('Failed to load location data');
        setDataLoading(false);
      }
    };

    loadGeoJSONData();
  }, []);

  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_ACCESS_TOKEN_HERE') {
      setError('Mapbox access token is required');
      setIsLoading(false);
      return;
    }

    if (!geojsonData || dataLoading) {
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
          map.addSource('points', {
            type: 'geojson',
            data: geojsonData,
            cluster: true,
            clusterRadius: 50.5,
            clusterMaxZoom: 14
          });
        
          if (showHeatmap) {
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
        
          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'points',
            filter: ['has', 'point_count'],
            paint: {
              'circle-radius': 1,
              'circle-opacity': 0
            }
          });
        
          setIsLoading(false);
          setShowBlipsLoading(true);
          setLoadingProgress(0);
        
          const syncClusterMarkers = () => {
            if (!mapInstance.current) return;
            const map = mapInstance.current;
            const src = map.getSource('points');
            if (!src) return;
        
            const features = map.queryRenderedFeatures({ layers: ['clusters'] });
            const wantedIds = new Set(features.map(f => f.properties.cluster_id));
        
            for (const [id, marker] of markersByIdRef.current.entries()) {
              if (!wantedIds.has(id)) {
                marker.remove();
                markersByIdRef.current.delete(id);
              }
            }
        
            if (features.length === 0) {
              setClusterMarkers([]);
              setShowBlipsLoading(false);
              setLoadingProgress(100);
              return;
            }
        
            let created = 0;
            const total = features.length;
        
            features.forEach((f) => {
              const id = f.properties.cluster_id;
              if (markersByIdRef.current.has(id)) return;
        
              const coords = f.geometry.coordinates.slice();
              const count = f.properties.point_count;
        
              src.getClusterLeaves(id, 1, 0, (err, leaves) => {
                const rep = leaves && leaves[0];
                const props = rep ? rep.properties : {};
        
                const el = document.createElement('div');
                el.className = 'cluster-marker';
                el.style.width = `${getClusterSize(count)}px`;
                el.style.height = `${getClusterSize(count)}px`;
                el.style.borderRadius = '50%';
                el.style.border = `1px solid ${getClusterColor(count)}`;
                el.style.backgroundColor = 'white';
                el.style.cursor = 'pointer';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                el.style.overflow = 'hidden';
        
                const img = document.createElement('img');
                img.src = props.photo || '';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '50%';
                el.appendChild(img);
        
                const popup = new mapboxgl.Popup({
                  closeButton: false,
                  closeOnClick: false,
                  closeOnMove: false,
                  className: 'custom-tooltip'
                }).setHTML(`
                  <div style="display: flex; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                    <div style="width: 8px; height: 8px; background: linear-gradient(45deg, #3b82f6, #8b5cf6); border-radius: 50%; margin-right: 8px;"></div>
                    <div style="font-weight: 700; color: #1f2937; font-size: 14px;">${props.name || ''}</div>
                  </div>
                  <div style="color: #374151; font-size: 12px; line-height: 1.6;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding: 4px 0;">
                      <span style="color: #6b7280; font-weight: 500;">State:</span>
                      <span style="color: #1f2937; font-weight: 600;">${props.state || ''}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding: 4px 0;">
                      <span style="color: #6b7280; font-weight: 500;">AC:</span>
                      <span style="color: #1f2937; font-weight: 600;">${props.ac || ''}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 4px 0;">
                      <span style="color: #6b7280; font-weight: 500;">Booth:</span>
                      <span style="color: #1f2937; font-weight: 600;">${props.booth_number || ''}</span>
                    </div>
                    <div style="background: rgba(0,0,0,0.05); padding: 8px; border-radius: 6px; margin-top: 8px;">
                      <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px; font-weight: 500;">Booth Name:</div>
                      <div style="color: #1f2937; font-size: 11px; line-height: 1.4; word-wrap: break-word;">
                        ${props['Booth Name'] || ''}
                      </div>
                    </div>
                  </div>
                `);
        
                el.addEventListener('mouseenter', () => {
                  popup.setLngLat(coords).addTo(map);
                });
        
                el.addEventListener('mouseleave', () => {
                  popup.remove();
                });
        
                el.addEventListener('click', () => {
                  const limit = Math.min(count, 100);
                  src.getClusterLeaves(id, limit, 0, (e2, allLeaves) => {
                    const representativeImage = props.photo || '';
                    const locations = (allLeaves || []).map(l => ({
                      name: l.properties.name || '',
                      state: l.properties.state || '',
                      ac: l.properties.ac || '',
                      booth_number: l.properties.booth_number || '',
                      photo: l.properties.photo || '',
                      lat: l.geometry.coordinates[1],
                      lng: l.geometry.coordinates[0]
                    }));
                    setSelectedCluster({
                      center: { lng: coords[0], lat: coords[1] },
                      count,
                      representativeImage,
                      locations
                    });
                    setShowClusterModal(true);
                  });
                });
        
                const marker = new mapboxgl.Marker(el).setLngLat(coords).addTo(map);
                markersByIdRef.current.set(id, marker);
        
                created += 1;
                setLoadingProgress(Math.round((created / total) * 100));
                setClusterMarkers(Array.from(markersByIdRef.current.values()));
                if (created === total) {
                  setShowBlipsLoading(false);
                }
              });
            });
          };
        
          map.on('moveend', syncClusterMarkers);
          map.on('zoomend', syncClusterMarkers);
          syncClusterMarkers();
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
  }, [center, zoom, apiKey, showHeatmap, geojsonData, dataLoading]);

  useEffect(() => {
    const markers = clusterMarkers;
    if (markers && markers.length > 0) {
      markers.forEach(marker => {
        marker.getElement().style.display = showImageBlips ? 'flex' : 'none';
      });
    }
  }, [showImageBlips, clusterMarkers]);
  
  const toggleImageBlips = () => {
    setShowImageBlips(!showImageBlips);
  };

  const handleSearch = async (query) => {
    if (!query.trim() || !mapInstance.current) return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${apiKey}&country=IN&limit=5`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (result) => {
    const [lng, lat] = result.center;
    mapInstance.current.flyTo({
      center: [lng, lat],
      zoom: 12,
      essential: true
    });
    setShowSearchResults(false);
    setSearchQuery(result.place_name);
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      const timeoutId = setTimeout(() => handleSearch(query), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.search-container')) {
      setShowSearchResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleZoomIn = () => {
    if (mapInstance.current) {
      const currentZoom = mapInstance.current.getZoom();
      mapInstance.current.zoomTo(currentZoom + 1, { duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (mapInstance.current) {
      const currentZoom = mapInstance.current.getZoom();
      mapInstance.current.zoomTo(currentZoom - 1, { duration: 300 });
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapInstance.current) {
          mapInstance.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true
          });
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location. Please check your browser permissions.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-20 w-[calc(100%-8rem)] sm:w-[calc(100%-12rem)] md:max-w-[20%]">
        <div className="relative search-container">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
            <div className="flex items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search location..."
                  className="w-full px-3 py-2 pr-8 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 text-sm sm:text-base"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 sm:max-h-60 overflow-y-auto z-30">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSearchResultClick(result)}
                    className="px-3 py-2 sm:px-4 sm:py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-2 sm:mr-3 mt-1">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {result.place_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                          {result.context?.map(ctx => ctx.text).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 sm:gap-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100"
            title="Zoom In"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
            title="Zoom Out"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          </button>
        </div>

        <button
          onClick={handleCurrentLocation}
          disabled={isLocating}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="My Location"
        >
          {isLocating ? (
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-blue-500 border-t-transparent"></div>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleImageBlips}
          className={`w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 flex items-center justify-center transition-all duration-200 ${
            showImageBlips 
              ? 'bg-blue-500/95 text-white hover:bg-blue-600/95' 
              : 'bg-white/95 text-gray-600 hover:bg-gray-50'
          }`}
          title={showImageBlips ? "Hide Image Blips" : "Show Image Blips"}
        >
          {showImageBlips ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>

      {(isLoading || dataLoading) && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">{dataLoading ? 'Loading location data...' : 'Loading map...'}</p>
          </div>
        </div>
      )}

      {showBlipsLoading && !isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <div className="flex-1">
                <p className="text-gray-700 font-medium">Loading images...</p>
                <p className="text-gray-500 text-sm">Preloading location photos</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-gray-500 text-xs mt-1">{loadingProgress}%</p>
              </div>
            </div>
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