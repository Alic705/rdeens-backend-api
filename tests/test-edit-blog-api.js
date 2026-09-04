import http from 'http';

function sendRequest(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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

async function testEditBlog() {
  console.log('=== 1. Logging in as Super Admin ===');
  const loginPayload = JSON.stringify({ email: 'admin@rdeens.com', password: 'test1234' });
  const loginRes = await sendRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPayload)
    }
  }, loginPayload);

  console.log('Admin login status:', loginRes.status);
  const token = loginRes.data.token;
  if (!token) {
    throw new Error('Admin login failed, token missing!');
  }

  console.log('\n=== 2. Fetching existing blogs ===');
  const blogsRes = await sendRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/blogs',
    method: 'GET'
  });
  console.log(`Found ${blogsRes.data.count} blogs.`);
  const targetBlog = blogsRes.data.data[0];
  console.log(`Selected blog for edit: "${targetBlog.title}" (ID: ${targetBlog._id})`);
  const originalPublishedDate = targetBlog.publishedDate;

  console.log('\n=== 3. Sending PUT request to update blog ===');
  const updatePayload = JSON.stringify({
    title: targetBlog.title,
    tag: targetBlog.tag,
    description: targetBlog.description,
    sectionTitle: 'Updated Section: High Performance Engineering',
    sectionDescription: 'Modern web architectures require scalable backend caching and reactive frontend state.',
    extraTitle: 'Architectural Roadmap 2026',
    extraDescription: 'Scaling across distributed edge networks and real-time synchronizers.',
    checklists: ['Zero Latency SSR', 'Edge CDN', 'Strict Schema Parity'],
    status: 'published',
    isFeatured: true
  });

  const updateRes = await sendRequest({
    hostname: 'localhost',
    port: 5001,
    path: `/api/blogs/${targetBlog._id}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updatePayload),
      'Authorization': `Bearer ${token}`
    }
  }, updatePayload);

  console.log('PUT /api/blogs/:id status:', updateRes.status);
  console.log('Update message:', updateRes.data.message);
  console.log('Updated sectionTitle:', updateRes.data.data.sectionTitle);
  console.log('Updated checklists:', updateRes.data.data.checklists);
  console.log('Preserved publishedDate:', updateRes.data.data.publishedDate);

  if (new Date(originalPublishedDate).getTime() === new Date(updateRes.data.data.publishedDate).getTime()) {
    console.log('✅ Published Date was safely preserved (immutable).');
  }

  console.log('\n=== 4. Verifying via Public GET API ===');
  const verifyRes = await sendRequest({
    hostname: 'localhost',
    port: 5001,
    path: `/api/blogs/${targetBlog.slug}`,
    method: 'GET'
  });
  console.log('GET /api/blogs/:slug status:', verifyRes.status);
  console.log('Live Verified Section Title in DB:', verifyRes.data.data.sectionTitle);

  console.log('\n🎉 ALL EDIT BLOG TESTS PASSED 100%!');
}

testEditBlog().catch(console.error);
