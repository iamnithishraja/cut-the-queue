import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const TOTAL_REQUESTS = 1000;
const CONCURRENT_BATCH = 50;

// Simulates a request with random processing time
const makeRequest = async () => {
  try {
    // Simulate different API endpoints
    const endpoints = ['/metrics'];
    const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    
    await axios.get(`${BASE_URL}${randomEndpoint}`);
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Normal load test
const normalLoadTest = async () => {
  console.log('Starting normal load test...');
  
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_BATCH) {
    const batch = Array(Math.min(CONCURRENT_BATCH, TOTAL_REQUESTS - i))
      .fill(null)
      .map(() => makeRequest());
    
    await Promise.all(batch);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between batches
  }
};

// Spike test
const spikeTest = async () => {
  console.log('Starting spike test...');
  
  // First create normal load
  const normalLoad = Array(10).fill(null).map(() => makeRequest());
  await Promise.all(normalLoad);
  
  console.log('Generating spike...');
  // Suddenly send 100 concurrent requests
  const spikeLoad = Array(100).fill(null).map(() => makeRequest());
  await Promise.all(spikeLoad);
};

// Main test runner
const runTests = async () => {
  // Run normal load test
  console.log('=== Running Normal Load Test ===');
  await normalLoadTest();
  
  // Wait for 30 seconds
  console.log('Waiting 30 seconds before spike test...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Run spike test
  console.log('=== Running Spike Test ===');
  await spikeTest();
};

runTests().catch(console.error);