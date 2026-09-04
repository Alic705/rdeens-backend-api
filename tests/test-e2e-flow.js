import dotenv from "dotenv";
dotenv.config();

import app from "../app.js";

async function runEndToEndVerification() {
  console.log("==================================================================");
  console.log("  END-TO-END VERIFICATION: WEB -> API -> MONGODB -> ADMIN        ");
  console.log("==================================================================");

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`🚀 API Server running on ${baseUrl}`);

    try {
      // 1. Simulate new-rdeens-web CTA Form submission
      console.log("\n[STEP 1: Client Website Submission]");
      const websitePayload = {
        fullName: "Johnathan Wick",
        email: "john.wick@continental.com",
        company: "Continental Enterprises",
        project: "We need an end-to-end web platform built with Angular SSR and Node.js microservices.",
      };
      console.log("Submitting payload from new-rdeens-web form:");
      console.log(JSON.stringify(websitePayload, null, 2));

      const submitRes = await fetch(`${baseUrl}/api/contact/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(websitePayload),
      });

      const submitData = await submitRes.json();
      console.log("\nResponse from POST /api/contact/submit:");
      console.log(`Status: ${submitRes.status}`);
      console.log("Body:", JSON.stringify(submitData, null, 2));

      if (submitRes.status !== 201 || !submitData.success) {
        throw new Error(`Submission failed with status ${submitRes.status}`);
      }
      console.log("✅ Step 1 Passed: Inquiry successfully accepted & stored in MongoDB Atlas.");

      // 2. Simulate rdeens-admin-dashboard Fetching Inquiries
      console.log("\n[STEP 2: Admin Dashboard Inquiries Fetch]");
      const adminRes = await fetch(`${baseUrl}/api/contact/all`);
      const adminData = await adminRes.json();

      console.log(`Response from GET /api/contact/all: Status ${adminRes.status}`);
      console.log(`Total Inquiries in DB: ${adminData.data?.length || 0}`);

      if (adminRes.status !== 200 || !Array.isArray(adminData.data)) {
        throw new Error(`Admin fetch failed with status ${adminRes.status}`);
      }

      const latestInquiry = adminData.data[0];
      console.log("\n[STEP 3: Verify Data Integrity for Admin Dashboard]");
      console.log("Latest Document Details:");
      console.log(` - ID: ${latestInquiry._id}`);
      console.log(` - Full Name: ${latestInquiry.firstName} ${latestInquiry.lastName}`);
      console.log(` - Email: ${latestInquiry.email}`);
      console.log(` - Company: ${latestInquiry.company}`);
      console.log(` - Subject: ${latestInquiry.subject}`);
      console.log(` - Message: ${latestInquiry.message}`);
      console.log(` - Status: ${latestInquiry.status}`);
      console.log(` - CreatedAt: ${latestInquiry.createdAt}`);

      if (
        latestInquiry.email === "john.wick@continental.com" &&
        latestInquiry.firstName === "Johnathan" &&
        latestInquiry.lastName === "Wick"
      ) {
        console.log("\n==================================================================");
        console.log("  🎉 SUCCESS: 3-TIER FLOW (WEB -> API -> DB -> ADMIN) 100% OK!   ");
        console.log("==================================================================");
      } else {
        throw new Error("Latest inquiry does not match submitted data!");
      }

      server.close(() => process.exit(0));
    } catch (err) {
      console.error("\n🔴 E2E Verification Failed:", err.message);
      server.close(() => process.exit(1));
    }
  });
}

runEndToEndVerification();
