import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../src/models/user.js";
import Blog from "../src/models/blog.js";

async function runBlogApiTest() {
  console.log("==================================================================");
  console.log("  STEP 2 VERIFICATION: BLOG MONGOOSE SCHEMA & API ENDPOINTS       ");
  console.log("==================================================================");

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`🚀 API Server active on ${baseUrl}`);

    try {
      // 1. Get or create Admin user & JWT token
      let adminUser = await User.findOne({ email: "admin@rdeens.com" });
      if (!adminUser) {
        adminUser = await User.create({
          name: "Super Admin",
          email: "admin@rdeens.com",
          password: "test1234",
          role: "admin",
        });
      }

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

      console.log("\n[TEST 1: Checklists Limit Validation (> 5 items should fail)]");
      const invalidPayload = {
        title: "Invalid Blog Test",
        tag: "Web Architecture",
        description: "Testing checklist validation over 5 items.",
        coverImage: "/uploads/blogs/test-cover.webp",
        detailImage: "/uploads/blogs/test-detail.webp",
        sectionTitle: "Section Title",
        sectionDescription: "Section Description",
        checklists: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6"], // 6 items
      };

      const failRes = await fetch(`${baseUrl}/api/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invalidPayload),
      });

      const failData = await failRes.json();
      console.log("Status Code:", failRes.status);
      console.log("Response:", JSON.stringify(failData, null, 2));

      if (failRes.status === 400 && !failData.success) {
        console.log("✅ Passed: Server correctly rejected > 5 checklist items with HTTP 400.");
      } else {
        throw new Error(`Expected 400 Bad Request, got ${failRes.status}`);
      }

      console.log("\n[TEST 2: Create Valid Blog Post via POST /api/blogs]");
      const validPayload = {
        title: "Next-Gen AI & Modern Web Architecture in 2026",
        tag: "AI & Technology",
        description:
          "Building scalable, dynamic full-stack applications with Angular SSR and Node.js microservices.",
        coverImage: "/uploads/blogs/sample-ai-cover.webp",
        checklists: [
          "Lightweight Hydration",
          "Edge Intelligence",
          "Dynamic State Management",
          "Zero-Layout Shift",
          "Automated Pipelines",
        ],
        sectionTitle: "The Evolution of Intelligent Web Apps",
        sectionDescription:
          "How micro-frontends and agentic automation enable responsive, accessible digital experiences across devices.",
        detailImage: "/uploads/blogs/sample-ai-detail.webp",
        extraTitle: "Scaling for Enterprise",
        extraDescription:
          "Best practices for containerized Node.js clusters and Atlas database connection pooling.",
        status: "published",
        isFeatured: true,
      };

      const createRes = await fetch(`${baseUrl}/api/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPayload),
      });

      const createData = await createRes.json();
      console.log("Status Code:", createRes.status);
      console.log("Response Body:", JSON.stringify(createData, null, 2));

      if (createRes.status !== 201 || !createData.success) {
        throw new Error(`Create blog failed with status ${createRes.status}`);
      }

      const createdBlog = createData.data;
      console.log("✅ Passed: Blog created with ID:", createdBlog._id);
      console.log("   Slug Generated:", createdBlog.slug);
      console.log("   PublishedDate Enforced:", createdBlog.publishedDate);

      console.log("\n[TEST 3: Fetch Public Blogs List via GET /api/blogs]");
      const listRes = await fetch(`${baseUrl}/api/blogs`);
      const listData = await listRes.json();
      console.log("Status Code:", listRes.status);
      console.log(`Found ${listData.data?.length || 0} published blogs.`);

      if (listRes.status === 200 && Array.isArray(listData.data)) {
        console.log("✅ Passed: Public list returns lightweight card objects.");
        console.log("First card preview:", listData.data[0]);
      } else {
        throw new Error(`Get blogs failed with status ${listRes.status}`);
      }

      console.log(`\n[TEST 4: Fetch Single Blog Detail via GET /api/blogs/${createdBlog.slug}]`);
      const detailRes = await fetch(`${baseUrl}/api/blogs/${createdBlog.slug}`);
      const detailData = await detailRes.json();
      console.log("Status Code:", detailRes.status);

      if (detailRes.status === 200 && detailData.data) {
        console.log("✅ Passed: Single blog detail retrieved accurately.");
        console.log(" - Title:", detailData.data.title);
        console.log(" - Tag:", detailData.data.tag);
        console.log(" - Checklists count:", detailData.data.checklists?.length);
        console.log(" - Section Title:", detailData.data.sectionTitle);
        console.log(" - Extra Title:", detailData.data.extraTitle);
      } else {
        throw new Error(`Get single blog failed with status ${detailRes.status}`);
      }

      console.log("\n[TEST 5: Fetch All Blogs (Admin) via GET /api/blogs/all]");
      const adminListRes = await fetch(`${baseUrl}/api/blogs/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adminListData = await adminListRes.json();
      console.log("Status Code:", adminListRes.status);
      console.log(`Admin retrieved ${adminListData.data?.length || 0} blogs.`);

      if (adminListRes.status === 200 && Array.isArray(adminListData.data)) {
        console.log("✅ Passed: Admin blog list operational.");
      } else {
        throw new Error(`Admin list failed with status ${adminListRes.status}`);
      }

      console.log("\n==================================================================");
      console.log("  🎉 STEP 2 COMPLETE: ALL BLOG API ENDPOINTS FULLY VERIFIED!      ");
      console.log("==================================================================");

      server.close(() => process.exit(0));
    } catch (err) {
      console.error("\n🔴 Blog Test Error:", err);
      server.close(() => process.exit(1));
    }
  });
}

runBlogApiTest();
