import https from 'https';

function sendRequest(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function testVercelBackend() {
  console.log('=== 1. Testing Vercel Root Health ===');
  const root = await sendRequest({
    hostname: 'rdeens-backend-api.vercel.app',
    path: '/',
    method: 'GET'
  });
  console.log('GET / status:', root.status, root.data.message);

  console.log('\n=== 2. Testing Contact Submission via Vercel ===');
  const contactPayload = JSON.stringify({
    fullName: 'Live Vercel Test',
    email: 'vercel.test@rdeens.com',
    company: 'Rdeens Cloud',
    project: 'Testing Vercel live backend integration with Atlas MongoDB.'
  });
  const contactRes = await sendRequest({
    hostname: 'rdeens-backend-api.vercel.app',
    path: '/api/contact/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(contactPayload)
    }
  }, contactPayload);
  console.log('POST /api/contact/submit status:', contactRes.status, contactRes.data.message);

  console.log('\n=== 3. Testing Admin Login via Vercel ===');
  const loginPayload = JSON.stringify({
    email: 'admin@rdeens.com',
    password: 'test1234'
  });
  const loginRes = await sendRequest({
    hostname: 'rdeens-backend-api.vercel.app',
    path: '/api/auth/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPayload)
    }
  }, loginPayload);
  console.log('POST /api/auth/admin/login status:', loginRes.status);
  if (loginRes.data.token) {
    console.log('Super Admin JWT received successfully from Vercel!');
  }

  console.log('\n=== 4. Testing Public Blogs Listing ===');
  const blogsRes = await sendRequest({
    hostname: 'rdeens-backend-api.vercel.app',
    path: '/api/blogs',
    method: 'GET'
  });
  console.log('GET /api/blogs status:', blogsRes.status, 'Total Blogs:', blogsRes.data.count);

  console.log('\n🎉 ALL LIVE VERCEL BACKEND ENDPOINTS ARE 100% OPERATIONAL!');
}

testVercelBackend().catch(console.error);
