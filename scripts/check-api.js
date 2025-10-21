import { readFileSync } from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables from .env file
function loadEnvVars() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error reading .env file:', error.message);
    return {};
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkAPI() {
  console.log('🔍 Checking API connection...\n');
  
  const envVars = loadEnvVars();
  const apiBaseUrl = envVars.VITE_API_BASE_URL || 'https://emprendu-desarrollo-production.up.railway.app';
  
  console.log(`📡 API Base URL: ${apiBaseUrl}`);
  console.log(`🔧 MSW Enabled: ${envVars.VITE_USE_MSW || 'not set'}\n`);
  
  // Test profile endpoint
  const profileUrl = `${apiBaseUrl}/profile`;
  
  try {
    console.log(`⏳ Testing: ${profileUrl}`);
    const response = await makeRequest(profileUrl);
    
    if (response.statusCode === 200) {
      console.log('✅ API Connection: OK');
      console.log(`📊 Status Code: ${response.statusCode}`);
      console.log('🎉 Backend is responding correctly!');
    } else {
      console.log(`⚠️  API Connection: Received status ${response.statusCode}`);
      console.log('📄 Response preview:', response.data.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ API Connection: FAILED');
    console.log(`💥 Error: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure Laravel backend is running: php artisan serve');
    console.log('   2. Check if backend is accessible at https://emprendu-desarrollo-production.up.railway.app');
    console.log('   3. Verify database credentials in backend/.env');
    console.log('   4. Check Laravel logs for any errors');
  }
}

checkAPI();
