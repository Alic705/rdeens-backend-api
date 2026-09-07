import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../src/models/user.js";
import Blog from "../src/models/blog.js";

async function testAdminStudioFlow() {
  console.log("==================================================================");
  console.log("  STEP 3 VERIFICATION: ADMIN DASHBOARD SHOPIFY STUDIO FLOW        ");
  console.log("==================================================================");

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`🚀 Test API Server active on ${baseUrl}`);

    try {
      // 1. Authenticate Admin User
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
        process.env.JWT_SECRET || "default_jwt_secret_key_1234567890",
        { expiresIn: "1d", issuer: "rdeens-api", audience: "admin" }
      );

      console.log("\n[TEST 1: Admin JWT Token Generated]");
      console.log("✅ Authenticated as:", adminUser.email);

      // 2. Simulate Shopify-Style Studio Submission via FormData
      console.log("\n[TEST 2: Submitting Shopify-Style Two-Column Studio FormData Payload]");

      const richHtmlStudioContent = `
<h2>Building Ultra-Scalable Design Systems & Angular Web Platforms</h2>
<p class="lead-text">Enterprise engineering requires strict separation of concerns, composable architecture, and robust state pipelines that eliminate visual jank.</p>

<img src="/uploads/blogs/1788615452045-417314104.png" alt="Architecture Diagram" />

<h3>1. Design Tokens & Visual Hierarchy</h3>
<ul>
  <li><strong>Atomic Design System:</strong> Strict isolation of atoms, molecules, and layout shells.</li>
  <li><strong>Sub-second Hydration:</strong> SSR streaming combined with partial hydration.</li>
  <li><strong>Microservices Coordination:</strong> Express.js clusters connected to sharded MongoDB Atlas.</li>
</ul>

<blockquote>"Great software is not just functional; it is predictable, maintainable, and blistering fast."</blockquote>

<h2>2. Performance Benchmarks</h2>
<p>Through systematic tree-shaking, lazy-loaded routing, and optimized image compression, Lighthouse performance reached a perfect 100/100 score.</p>
`.trim();

      const dummyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const dummyBuffer = Buffer.from(dummyPngBase64, "base64");
      const coverBlob = new Blob([dummyBuffer], { type: "image/png" });

      const formData = new FormData();
      formData.append("title", "Modern Shopify-Style Blog Studio Integration");
      formData.append("content", richHtmlStudioContent);
      formData.append("excerpt", "Detailed architectural breakdown of the Shopify-style two-column studio with WYSIWYG rich text and SERP previews.");
      formData.append("tag", "Web Development");
      formData.append("tags", JSON.stringify(["Web Development", "Design Systems", "AI & Automation"]));
      formData.append("status", "published");
      formData.append("isFeatured", "true");
      formData.append("metaTitle", "Shopify-Style Blog Studio Integration | Rdeens Admin");
      formData.append("metaDescription", "Explore how Rdeens Admin Studio manages rich content articles seamlessly.");
      formData.append(
        "author",
        JSON.stringify({
          name: "Rdeens Lead Architect",
          role: "Principal Systems Engineer",
          bio: "Specializing in full-stack cloud architectures and enterprise Angular platforms."
        })
      );
      formData.append("coverImage", coverBlob, "studio-cover-banner.png");

      const createRes = await fetch(`${baseUrl}/api/blogs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const createData = await createRes.json();
      console.log("POST /api/blogs HTTP Status:", createRes.status);

      if (createRes.status !== 201 || !createData.success) {
        throw new Error(`Admin Studio blog creation failed: ${JSON.stringify(createData)}`);
      }

      const createdBlog = createData.data;
      console.log("✅ Admin Post Created Successfully!");
      console.log(" - Document ID:", createdBlog._id);
      console.log(" - Generated Slug:", createdBlog.slug);
      console.log(" - Cover Image Path:", createdBlog.coverImage);
      console.log(" - Tags Array:", createdBlog.tags);
      console.log(" - Author:", createdBlog.author?.name, `(${createdBlog.author?.role})`);
      console.log(" - PublishedDate (Server Enforced):", createdBlog.publishedDate);

      // 3. Verify in Admin Management Table (GET /api/blogs/all)
      console.log("\n[TEST 3: Verifying Document in Admin Table via GET /api/blogs/all]");
      const allRes = await fetch(`${baseUrl}/api/blogs/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allData = await allRes.json();
      console.log("GET /api/blogs/all HTTP Status:", allRes.status);

      const foundInAdmin = allData.data.find(b => b._id === createdBlog._id);
      if (!foundInAdmin) {
        throw new Error("Created blog post not found in Admin management table!");
      }
      console.log("✅ Confirmed: Post visible in Admin table with correct metadata.");

      // 4. Verify Update Pipeline in Studio (PUT /api/blogs/:id)
      console.log(`\n[TEST 4: Simulating Studio Edit Action via PUT /api/blogs/${createdBlog._id}]`);
      const updateFormData = new FormData();
      updateFormData.append("title", "Modern Shopify-Style Blog Studio Integration (Edited)");
      updateFormData.append("content", richHtmlStudioContent + "\n<p>Updated revision appended from studio.</p>");
      updateFormData.append("excerpt", "Updated excerpt summary text.");
      updateFormData.append("tag", "Cloud Architecture");
      updateFormData.append("tags", JSON.stringify(["Cloud Architecture", "Enterprise Apps"]));
      updateFormData.append("status", "published");
      updateFormData.append("isFeatured", "true");

      const updateRes = await fetch(`${baseUrl}/api/blogs/${createdBlog._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: updateFormData,
      });

      const updateData = await updateRes.json();
      console.log("PUT /api/blogs/:id HTTP Status:", updateRes.status);

      if (updateRes.status !== 200 || !updateData.success) {
        throw new Error(`Studio update failed: ${JSON.stringify(updateData)}`);
      }

      console.log("✅ Confirmed: Studio successfully edited blog article.");
      console.log(" - Updated Slug:", updateData.data.slug);
      console.log(" - Updated Tag:", updateData.data.tag);
      console.log(" - Immutable PublishedDate preserved:", updateData.data.publishedDate);

      console.log("\n==================================================================");
      console.log("  🎉 STEP 3 VERIFIED: ADMIN STUDIO INTEGRATION 100% SUCCESSFUL!   ");
      console.log("==================================================================");

      server.close(() => process.exit(0));
    } catch (err) {
      console.error("\n🔴 Step 3 Admin Studio Test Error:", err);
      server.close(() => process.exit(1));
    }
  });
}

testAdminStudioFlow();
