import MapboxMap from './components/MapboxMap';
import { useState, useEffect } from 'react';

function App() {
  const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE';
  const [dataCount, setDataCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const loadDataCount = async () => {
      try {
        const response = await fetch('/api/geojson');
        if (response.ok) {
          const data = await response.json();
          setDataCount(data.features?.length || 0);
        }
      } catch (error) {
        console.error('Error loading data count:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadDataCount();
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-orange-50 flex items-center justify-center p-2">
      <div className="w-full max-w-[95vw] mx-auto h-full flex flex-col">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex-1 flex flex-col">
          <div className="p-4 flex-1 flex flex-col">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full mb-3">
                <span className="text-white text-xl">🔥</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Man Ki Baat Visualization
              </h1>
              
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-pink-100 rounded-full border border-yellow-200">
                <span className="text-yellow-700 font-semibold text-sm">
                  📍 {dataLoading ? 'Loading...' : `${dataCount.toLocaleString()} data points across India`}
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <MapboxMap 
                center={{ lat: 20.5937, lng: 78.9629 }}
                zoom={5}
                apiKey={MAPBOX_ACCESS_TOKEN}
                showHeatmap={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
