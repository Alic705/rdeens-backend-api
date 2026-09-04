import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../src/models/user.js";

async function testAdminBlogCreation() {
  console.log("==================================================================");
  console.log("  STEP 3: ADMIN DASHBOARD BLOG INTEGRATION & VERIFICATION         ");
  console.log("==================================================================");

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`🚀 API Server running on ${baseUrl}`);

    try {
      const adminUser = await User.findOne({ email: "admin@rdeens.com" });
      const token = jwt.sign(
        {
          userId: adminUser._id,
          role: adminUser.role,
          name: adminUser.name,
          email: adminUser.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d", issuer: "rdeens-api", audience: "admin" }
      );

      console.log("\n[STEP 3.1: Admin Submitting New Blog Post]");
      const adminPayload = {
        title: "Mastering Angular 18 SSR and Microservices",
        tag: "Web Development",
        description: "A deep dive into building ultra-fast server rendered web platforms with clean architecture.",
        sectionTitle: "High Performance Server-Side Rendering",
        sectionDescription: "Why hydration strategies and zero-flicker site data preloading deliver superior user experiences.",
        extraTitle: "Production Deployment Strategies",
        extraDescription: "Configuring edge reverse proxies and container orchestrators for zero-downtime rollouts.",
        coverImage: "/uploads/blogs/sample-web-cover.webp",
        detailImage: "/uploads/blogs/sample-web-detail.webp",
        checklists: [
          "Optimized SSR Hydration",
          "Automated Image Pipeline",
          "Edge CDN Caching",
          "SEO Meta Synchronizer",
        ],
        status: "published",
        isFeatured: true,
      };

      const res = await fetch(`${baseUrl}/api/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(adminPayload),
      });

      const data = await res.json();
      console.log(`POST /api/blogs Status: ${res.status}`);
      console.log("Response:", JSON.stringify(data, null, 2));

      if (res.status !== 201 || !data.success) {
        throw new Error(`Admin blog creation failed with status ${res.status}`);
      }

      console.log("✅ Admin Creation Passed: Blog stored in MongoDB Atlas.");
      console.log("   Blog ID:", data.data._id);
      console.log("   PublishedDate Enforced:", data.data.publishedDate);

      console.log("\n[STEP 3.2: Admin Fetching Full Blog Management Table]");
      const tableRes = await fetch(`${baseUrl}/api/blogs/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tableData = await tableRes.json();
      console.log(`GET /api/blogs/all Status: ${tableRes.status}`);
      console.log(`Total Blogs in Admin Table: ${tableData.data?.length || 0}`);

      if (tableRes.status === 200 && Array.isArray(tableData.data)) {
        console.log("✅ Admin Listing Passed: Table receives full blog list.");
        tableData.data.forEach((b, i) => {
          console.log(`   [${i + 1}] "${b.title}" | Tag: ${b.tag} | Status: ${b.status} | Date: ${b.publishedDate || b.createdAt}`);
        });
      } else {
        throw new Error("Admin list failed!");
      }

      console.log("\n==================================================================");
      console.log("  🎉 STEP 3 VERIFIED: ADMIN BLOG CREATION & LISTING WORKING 100% ");
      console.log("==================================================================");

      server.close(() => process.exit(0));
    } catch (err) {
      console.error("\n🔴 Step 3 Test Error:", err);
      server.close(() => process.exit(1));
    }
  });
}

testAdminBlogCreation();
