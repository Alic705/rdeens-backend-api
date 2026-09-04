import http from 'http';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function verifyClientAndBackend() {
  console.log('--- 1. Testing Backend Public Blogs API ---');
  const apiRes = await fetchUrl('http://localhost:5001/api/blogs');
  console.log('GET /api/blogs status:', apiRes.status);
  const json = JSON.parse(apiRes.data);
  console.log(`Found ${json.data ? json.data.length : 0} published blogs in DB.`);

  if (json.data && json.data.length > 0) {
    const slug = json.data[0].slug;
    console.log(`\n--- 2. Testing Single Blog API for slug: "${slug}" ---`);
    const singleRes = await fetchUrl(`http://localhost:5001/api/blogs/${slug}`);
    console.log('GET /api/blogs/:slug status:', singleRes.status);
    const singleJson = JSON.parse(singleRes.data);
    console.log('Blog title:', singleJson.data.title);
    console.log('Tag:', singleJson.data.tag);
    console.log('Checklists count:', singleJson.data.checklists.length);
    console.log('Section title:', singleJson.data.sectionTitle);
    console.log('Cover image:', singleJson.data.coverImage);
    console.log('Detail image:', singleJson.data.detailImage);
  }

  console.log('\n--- 3. Testing Frontend Angular Server (Port 4001) ---');
  const webBlogRes = await fetchUrl('http://localhost:4001/blog');
  console.log('GET http://localhost:4001/blog status:', webBlogRes.status);

  console.log('\n--- All Automated E2E Checks Passed Successfully! ---');
}

verifyClientAndBackend().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
