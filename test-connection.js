/**
 * Test Backend Connection
 * Run this to verify backend is accessible from frontend
 * 
 * Usage: node test-connection.js
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function testConnection() {
  console.log('🧪 Testing Backend Connection...\n');
  console.log(`API URL: ${API_URL}\n`);

  const tests = [
    {
      name: 'Health Check',
      url: 'http://localhost:3001/health',
      method: 'GET',
    },
    {
      name: 'API Base',
      url: `${API_URL}`,
      method: 'GET',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`  URL: ${test.url}`);
      
      const response = await fetch(test.url, {
        method: test.method,
      });

      if (response.ok) {
        console.log(`  ✅ Status: ${response.status} ${response.statusText}`);
        
        try {
          const data = await response.json();
          console.log(`  📦 Response:`, JSON.stringify(data, null, 2));
        } catch (e) {
          console.log(`  📦 Response: (non-JSON)`);
        }
        
        passed++;
      } else {
        console.log(`  ❌ Status: ${response.status} ${response.statusText}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Make sure:');
    console.log('  1. Backend server is running (npm run dev in backend/)');
    console.log('  2. Backend is on http://localhost:3001');
    console.log('  3. No firewall blocking localhost');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Backend is accessible.');
    process.exit(0);
  }
}

testConnection();
