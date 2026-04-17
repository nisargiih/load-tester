const express = require("express");
const { setConfig } = require("npm-increaser-downloads/lib/src/config");
const { getVersionPackage, downloadPackage } = require("npm-increaser-downloads/lib/src/spammer/spammer");
const { Stats } = require("npm-increaser-downloads/lib/src/models/stats.model");

const app = express();
const PACKAGES = ["cron-guardian", "express-backend-setup"];

async function boostPackage(packageName, numDownloads) {
  setConfig({ packageName, numDownloads, maxConcurrentDownloads: 50, downloadTimeout: 5000 });
  const version = await getVersionPackage();
  const stats = new Stats(Date.now());
  const batchSize = 50;
  for (let i = 0; i < numDownloads; i += batchSize) {
    const batch = Math.min(batchSize, numDownloads - i);
    await Promise.all(Array.from({ length: batch }, () => downloadPackage(version, stats)));
    await new Promise((r) => setTimeout(r, 100));
  }
  return { packageName, numDownloads, successful: stats.successfulDownloads, failed: stats.failedDownloads };
}

app.get("/boost", async (req, res) => {
  const numDownloads = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
  try {
    const results = await Promise.all(PACKAGES.map((pkg) => boostPackage(pkg, numDownloads)));
    res.json({ numDownloads, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
