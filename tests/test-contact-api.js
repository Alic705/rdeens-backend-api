import dotenv from "dotenv";
dotenv.config();

import app from "../app.js";

async function testContactApiEndpoints() {
  console.log("==========================================");
  console.log("  PHASE 2: EXPRESS API ENDPOINTS TEST     ");
  console.log("==========================================");

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Test server active on ${baseUrl}`);

    try {
      // Wait for DB connection
      await new Promise((r) => setTimeout(r, 1500));

      console.log("\n[TEST 1] Testing POST /api/contact/submit...");
      const postPayload = {
        firstName: "Sarah",
        lastName: "Connor",
        email: "sarah.connor@cyberdyne.io",
        subject: "General Inquiry",
        message: "Requesting information regarding systems integration services.",
      };

      const postResponse = await fetch(`${baseUrl}/api/contact/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload),
      });

      const postData = await postResponse.json();
      console.log("Status Code:", postResponse.status);
      console.log("Response Body:", JSON.stringify(postData, null, 2));

      if (postResponse.status === 201 && postData.success) {
        console.log("✅ POST /api/contact/submit PASSED (201 Created)");
      } else {
        throw new Error(`POST failed with status ${postResponse.status}`);
      }

      console.log("\n[TEST 2] Testing GET /api/contact/all...");
      const getResponse = await fetch(`${baseUrl}/api/contact/all`);
      const getData = await getResponse.json();

      console.log("Status Code:", getResponse.status);
      console.log(`Retrieved ${getData.data?.length || 0} inquiries.`);

      if (getResponse.status === 200 && Array.isArray(getData.data)) {
        console.log("✅ GET /api/contact/all PASSED (200 OK)");
        console.log("Latest inquiry:", getData.data[0]);
      } else {
        throw new Error(`GET failed with status ${getResponse.status}`);
      }

      console.log("\n==========================================");
      console.log("  ALL API ENDPOINTS VERIFIED AND WORKING  ");
      console.log("==========================================");

      server.close(() => {
        process.exit(0);
      });
    } catch (err) {
      console.error("🔴 API Test Error:", err);
      server.close(() => {
        process.exit(1);
      });
    }
  });
}

testContactApiEndpoints();
