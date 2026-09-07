import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../src/models/user.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testInlineImageUpload() {
  console.log("==================================================================");
  console.log("  STEP 2 VERIFICATION: INLINE IMAGE UPLOAD ENDPOINT TEST          ");
  console.log("==================================================================");

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
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

      // Create a temporary dummy webp/png buffer for testing multipart upload
      const dummyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const dummyBuffer = Buffer.from(dummyPngBase64, "base64");

      const blob = new Blob([dummyBuffer], { type: "image/png" });
      const formData = new FormData();
      formData.append("image", blob, "test-inline-diagram.png");

      console.log("Sending POST /api/blogs/upload-image with multipart FormData...");
      const uploadRes = await fetch(`${baseUrl}/api/blogs/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      console.log("HTTP Status:", uploadRes.status);
      console.log("Response Body:", JSON.stringify(uploadData, null, 2));

      if (uploadRes.status === 200 && uploadData.url) {
        console.log("✅ Passed: Inline image upload successfully returned accessible URL:", uploadData.url);
      } else {
        throw new Error(`Inline image upload failed: ${JSON.stringify(uploadData)}`);
      }

      server.close(() => process.exit(0));
    } catch (err) {
      console.error("🔴 Inline Image Test Error:", err);
      server.close(() => process.exit(1));
    }
  });
}

testInlineImageUpload();
