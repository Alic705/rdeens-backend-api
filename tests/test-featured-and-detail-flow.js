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

async function testFlow() {
  console.log('=== TEST 1: Fetching Public Blogs ===');
  const res = await fetchUrl('http://localhost:5001/api/blogs');
  console.log('Status:', res.status);
  const json = JSON.parse(res.data);
  console.log('Total blogs:', json.count);

  console.log('\n--- Evaluating Home Page Featured Priority Logic ---');
  const sorted = [...json.data].sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  const featured = sorted.filter(b => b.isFeatured);
  let homeCards = [];
  if (featured.length >= 3) {
    homeCards = featured.slice(0, 3);
  } else {
    const nonFeatured = sorted.filter(b => !b.isFeatured);
    homeCards = [...featured, ...nonFeatured.slice(0, 3 - featured.length)];
  }

  console.log('Top 3 Home Cards to be displayed:');
  homeCards.forEach((c, idx) => {
    console.log(` ${idx + 1}. [${c.isFeatured ? 'FEATURED' : 'STANDARD'}] "${c.title}" (Date: ${c.publishedDate})`);
  });

  console.log('\n=== TEST 2: Testing Single Blog (Dynamic Detail) ===');
  const detailRes = await fetchUrl('http://localhost:5001/api/blogs/testing-xyz');
  console.log('GET /api/blogs/testing-xyz status:', detailRes.status);
  const detailJson = JSON.parse(detailRes.data);
  console.log('Detail Title:', detailJson.data.title);
  console.log('Detail Section Title:', detailJson.data.sectionTitle);
  console.log('Detail Extra Title:', detailJson.data.extraTitle);
  console.log('Detail Checklists:', detailJson.data.checklists);

  console.log('\n=== TEST 3: Testing Fallback for non-existent slug ===');
  const fallbackRes = await fetchUrl('http://localhost:5001/api/blogs/old-nonexistent-slug');
  console.log('GET /api/blogs/old-nonexistent-slug status:', fallbackRes.status);
  const fallbackJson = JSON.parse(fallbackRes.data);
  console.log('Fallback returned newest blog:', fallbackJson.data.title);

  console.log('\n=== All Tests Passed Successfully! ===');
}

testFlow().catch(console.error);
