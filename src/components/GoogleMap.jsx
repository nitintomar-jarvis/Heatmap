import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMap = ({ center = { lat: 37.7749, lng: -122.4194 }, zoom = 10, apiKey }) => {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('Google Maps API key is required');
      return;
    }

    console.log('Loading Google Maps with API key:', apiKey.substring(0, 10) + '...');

    const loader = new Loader({
      apiKey: 'AIzaSyAqlLNagX_XNQGJQMBsGJ9g2B9TB2QnItM',
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then((google) => {
      console.log('Google Maps loaded successfully');
      if (mapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        new google.maps.Marker({
          position: center,
          map: map,
          title: 'Selected Location'
        });
        
        console.log('Map initialized successfully');
        setIsLoading(false);
      }
    }).catch((error) => {
      console.error('Error loading Google Maps:', error);
      console.error('Full error details:', error);
      setError(error.message);
      setIsLoading(false);
    });
  }, [center, zoom, apiKey]);

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg border-2 border-gray-300 relative">
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
        className="w-full h-full"
        style={{ minHeight: '384px' }}
      />
    </div>
  );
};

export default GoogleMap;
