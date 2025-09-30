import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, 'src/data/locations4.js');
const outputPath = path.join(__dirname, 'public/geojson4.json');

function parseJavaScriptArray(content) {
  const locations = [];
  let braceCount = 0;
  let inObject = false;
  let currentObject = '';
  let inString = false;
  let stringChar = '';
  let processedChars = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';
    processedChars++;
    
    if (processedChars % 500000 === 0) {
      console.log(`Processed ${processedChars} characters, found ${locations.length} locations`);
    }
    
    if (!inString) {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        currentObject += char;
      } else if (char === '{' && !inObject) {
        inObject = true;
        currentObject = char;
        braceCount = 1;
      } else if (inObject) {
        currentObject += char;
        
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          
          if (braceCount === 0) {
            try {
              const obj = eval('(' + currentObject + ')');
              if (obj.lat && obj.lng && !isNaN(obj.lat) && !isNaN(obj.lng)) {
                locations.push(obj);
              }
            } catch (e) {
              console.warn('Failed to parse object at character', processedChars, ':', e.message);
            }
            
            currentObject = '';
            inObject = false;
          }
        }
      }
    } else {
      currentObject += char;
      
      if (char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      }
    }
  }
  
  return locations;
}

async function convertLocationsToGeoJSON() {
  try {
    console.log('Reading locations4.js file...');
    
    const fileContent = fs.readFileSync(inputPath, 'utf8');
    
    const arrayStart = fileContent.indexOf('export const locationsData = [');
    if (arrayStart === -1) {
      throw new Error('Could not find locationsData array in the file');
    }
    
    const arrayContent = fileContent.substring(arrayStart + 'export const locationsData = ['.length);
    const arrayEnd = arrayContent.lastIndexOf('];');
    const arrayBody = arrayContent.substring(0, arrayEnd);
    
    console.log('Parsing JavaScript array...');
    const locations = parseJavaScriptArray(arrayBody);
    
    console.log(`Parsed ${locations.length} locations`);
    
    const geojson = {
      type: 'FeatureCollection',
      features: locations.map((loc, index) => ({
        type: 'Feature',
        id: index,
        geometry: {
          type: 'Point',
          coordinates: [loc.lng, loc.lat]
        },
        properties: {
          name: loc.name || '',
          state: loc.state || '',
          ac: loc.ac || '',
          ac_number: loc.ac_number || '',
          booth_number: loc.booth_number || '',
          booth_name: loc.booth_name || '',
          photo: loc.photo || '',
          file_two_url: loc.file_two_url || '',
          weight: 1
        }
      }))
    };
    
    console.log('Writing GeoJSON file...');
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2), 'utf8');
    
    console.log(`Successfully converted ${locations.length} locations to GeoJSON format`);
    console.log(`Output file: ${outputPath}`);
    console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('Error converting to GeoJSON:', error);
  }
}

convertLocationsToGeoJSON();
