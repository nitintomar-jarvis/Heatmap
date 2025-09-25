import { useState } from 'react';

const ClusterModal = ({ isOpen, onClose, cluster }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!isOpen || !cluster) return null;

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              {cluster.locations.length} Images reported
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cluster.locations.map((location, index) => (
                <div
                  key={index}
                  className="relative group cursor-pointer"
                  onClick={() => handleImageClick(location)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={location.photo}
                      alt={location.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-white bg-opacity-90 rounded-full p-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 truncate">{location.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <button
              onClick={handleCloseImage}
              className="absolute top-4 right-4 text-white text-3xl z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
            >
              ×
            </button>
            
            <div className="bg-white rounded-2xl max-h-[90vh] overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2 p-6">
                  <img
                    src={selectedImage.photo}
                    alt={selectedImage.name}
                    className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                  />
                  {selectedImage.file_two_url && (
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold mb-2">Additional Photo:</h4>
                      <img
                        src={selectedImage.file_two_url}
                        alt={`${selectedImage.name} - Additional`}
                        className="w-full h-auto max-h-[40vh] object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
                
                <div className="lg:w-1/2 p-6 overflow-y-auto max-h-[90vh]">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">{selectedImage.name}</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">Location Details</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">State:</span>
                          <span className="font-medium">{selectedImage.state}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assembly Constituency:</span>
                          <span className="font-medium">{selectedImage.ac}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AC Number:</span>
                          <span className="font-medium">{selectedImage.ac_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Booth Number:</span>
                          <span className="font-medium">{selectedImage.booth_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Booth Name:</span>
                          <span className="font-medium text-right">{selectedImage["Booth Name"]}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">Coordinates</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Latitude:</span>
                          <span className="font-medium">{selectedImage.lat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Longitude:</span>
                          <span className="font-medium">{selectedImage.lng}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">Photo URLs</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 block mb-1">Primary Photo:</span>
                          <a 
                            href={selectedImage.photo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 break-all"
                          >
                            View Photo
                          </a>
                        </div>
                        {selectedImage.file_two_url && (
                          <div>
                            <span className="text-gray-600 block mb-1">Secondary Photo:</span>
                            <a 
                              href={selectedImage.file_two_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 break-all"
                            >
                              View Photo
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClusterModal;
