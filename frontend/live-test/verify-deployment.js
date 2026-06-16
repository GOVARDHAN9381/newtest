const https = require('https');
const http = require('http');

const urlString = process.argv[2];
if (!urlString) {
  console.error('Usage: node verify-deployment.js <url>');
  process.exit(1);
}

console.log(`Checking deployment at URL: ${urlString}`);
const startTime = Date.now();
const TIMEOUT_MS = 300000; // 5 minutes

function checkUrl() {
  if (Date.now() - startTime > TIMEOUT_MS) {
    console.error('❌ Timeout reached: Deployment did not become live within 5 minutes.');
    process.exit(1);
  }

  const requester = urlString.startsWith('https') ? https : http;
  
  requester.get(urlString, (res) => {
    console.log(`HTTP GET Response Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('✅ Success! The deployment is live and returned HTTP 200.');
      process.exit(0);
    } else {
      console.log('⏳ Deployment is not ready yet. Retrying in 15 seconds...');
      setTimeout(checkUrl, 15000);
    }
  }).on('error', (err) => {
    console.log(`⏳ Network error (${err.message}). Retrying in 15 seconds...`);
    setTimeout(checkUrl, 15000);
  });
}

checkUrl();
