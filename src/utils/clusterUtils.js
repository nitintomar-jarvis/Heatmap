export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const createClusters = (locations, clusterRadius = 0.5) => {
  const clusters = [];
  const processed = new Set();

  locations.forEach((location, index) => {
    if (processed.has(index)) return;

    const cluster = {
      id: `cluster_${index}`,
      center: { lat: location.lat, lng: location.lng },
      locations: [location],
      representativeImage: location.photo,
      count: 1
    };

    processed.add(index);

    locations.forEach((otherLocation, otherIndex) => {
      if (processed.has(otherIndex) || index === otherIndex) return;

      const distance = calculateDistance(
        location.lat, location.lng,
        otherLocation.lat, otherLocation.lng
      );

      if (distance <= clusterRadius) {
        cluster.locations.push(otherLocation);
        cluster.count++;
        processed.add(otherIndex);

        const centerLat = cluster.locations.reduce((sum, loc) => sum + loc.lat, 0) / cluster.locations.length;
        const centerLng = cluster.locations.reduce((sum, loc) => sum + loc.lng, 0) / cluster.locations.length;
        cluster.center = { lat: centerLat, lng: centerLng };
      }
    });

    clusters.push(cluster);
  });

  return clusters;
};

export const getClusterSize = (count) => {
  if (count <= 3) return 20;
  if (count <= 10) return 30;
  if (count <= 25) return 40;
  return 50;
};

export const getClusterColor = (count) => {
  if (count <= 3) return '#10B981';
  if (count <= 10) return '#F59E0B';
  if (count <= 25) return '#EF4444';
  return '#8B5CF6';
};
