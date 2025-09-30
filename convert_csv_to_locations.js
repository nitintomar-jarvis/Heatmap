import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, 'src/data/mann_ki_baat_2025-09-28 (8) (1).csv');
const outputPath = path.join(__dirname, 'src/data/locations4.js');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function convertCSVToLocations() {
  try {
    const fileStream = createReadStream(csvPath, { encoding: 'utf8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let headers = null;
    const locations = [];
    let lineCount = 0;

    console.log('Starting to process CSV file...');

    for await (const line of rl) {
      lineCount++;
      
      if (lineCount % 10000 === 0) {
        console.log(`Processed ${lineCount} lines, found ${locations.length} valid locations`);
      }

      if (lineCount === 1) {
        headers = parseCSVLine(line);
        console.log('Headers:', headers);
        continue;
      }

      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      const values = parseCSVLine(trimmedLine);
      
      if (values.length >= headers.length) {
        const location = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          
          if (header === 'latitude') {
            location.lat = parseFloat(value);
          } else if (header === 'longitude') {
            location.lng = parseFloat(value);
          } else if (header === 'user_name') {
            location.name = value;
          } else if (header === 'file_one_url') {
            location.photo = value;
          } else {
            location[header] = value;
          }
        });
        
        if (location.name && !isNaN(location.lat) && !isNaN(location.lng) && location.photo) {
          locations.push(location);
        }
      }
    }

    console.log(`Finished processing ${lineCount} lines, found ${locations.length} valid locations`);

    const jsContent = `export const locationsData = [
${locations.map(loc => {
  const props = Object.entries(loc).map(([key, value]) => {
    if (typeof value === 'string') {
      const escapedValue = value.replace(/"/g, '\\"');
      if (key.includes(' ')) {
        return `"${key}": "${escapedValue}"`;
      } else {
        return `${key}: "${escapedValue}"`;
      }
    } else {
      if (key.includes(' ')) {
        return `"${key}": ${value}`;
      } else {
        return `${key}: ${value}`;
      }
    }
  }).join(', ');
  return `  { ${props} }`;
}).join(',\n')}
];`;

    fs.writeFileSync(outputPath, jsContent, 'utf8');
    
    console.log(`Successfully converted ${locations.length} locations to ${outputPath}`);
    console.log('Sample converted data with all fields:');
    console.log(JSON.stringify(locations.slice(0, 2), null, 2));
    
  } catch (error) {
    console.error('Error converting CSV:', error);
  }
}

convertCSVToLocations();
