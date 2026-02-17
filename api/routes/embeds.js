const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Embed = require("../models/Embed");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

const EMBED_LIMIT = 7;
const UPLOADS_DIR = path.join(__dirname, "../uploads/embeds");

// =======================
// Multer Configuration
// =======================
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `embed-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// =======================
// Helper: Clean Orphaned Files
// =======================
function cleanupEmbedFiles(oldEmbed, newEmbedData) {
  try {
    const getLocalFiles = (obj) => {
      const files = [];
      if (!obj) return files;
      const extract = (url) => {
        if (
          url &&
          typeof url === "string" &&
          url.includes("/uploads/embeds/")
        ) {
          return url.split("/uploads/embeds/").pop();
        }
        return null;
      };

      if (obj.image?.url) files.push(extract(obj.image.url));
      if (obj.thumbnail?.url) files.push(extract(obj.thumbnail.url));
      if (obj.author?.icon_url) files.push(extract(obj.author.icon_url));
      if (obj.footer?.icon_url) files.push(extract(obj.footer.icon_url));

      return files.filter(Boolean);
    };

    const oldFiles = getLocalFiles(oldEmbed.embedData);
    const newFiles = newEmbedData ? getLocalFiles(newEmbedData) : [];

    // Find files present in Old but NOT in New
    const toDelete = oldFiles.filter((f) => !newFiles.includes(f));

    toDelete.forEach((filename) => {
      const filePath = path.join(UPLOADS_DIR, filename);
      // Security check to ensure we stay in uploads dir
      if (
        !filePath.startsWith(UPLOADS_DIR) ||
        filename.includes("..") ||
        filename.includes("/") ||
        filename.includes("\\")
      ) {
        return;
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted orphaned embed file: ${filename}`);
      }
    });
  } catch (err) {
    logger.error("Error cleaning up embed files:", err);
  }
}

// =======================
// Upload Image
// =======================
router.post(
  "/upload/:guildId",
  checkGuildPermission("embeds"),
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/embeds/${
        req.file.filename
      }`;
      res.json({ success: true, url: imageUrl, filename: req.file.filename });
    } catch (err) {
      logger.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// =======================
// Delete Image (Direct)
// =======================
router.delete(
  "/upload/:guildId/:filename",
  checkGuildPermission("embeds"),
  (req, res) => {
    try {
      const filePath = path.join(UPLOADS_DIR, req.params.filename);

      // Prevent path traversal
      if (
        req.params.filename.includes("..") ||
        req.params.filename.includes("/")
      ) {
        return res.status(400).json({ error: "Invalid filename" });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ success: true });
    } catch (err) {
      logger.error("Delete error:", err);
      res.status(500).json({ error: "Delete failed" });
    }
  }
);

// =======================
// Get Embeds
// =======================
router.get(
  "/guild/:guildId",
  checkGuildPermission("embeds"),
  async (req, res) => {
    try {
      const { guildId } = req.params;
      const embeds = await Embed.find({ guildId }).sort({ createdAt: -1 });
      res.json(embeds);
    } catch (error) {
      logger.error("Error fetching embeds:", error);
      res.status(500).json({ error: "Failed to fetch embeds" });
    }
  }
);

// =======================
// Create Embed
// =======================
router.post(
  "/guild/:guildId",
  checkGuildPermission("embeds"),
  async (req, res) => {
    try {
      const { guildId } = req.params;
      const { name, code, embedData } = req.body;
      const authHeader = req.headers.authorization;

      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );

      // Check limit
      const count = await Embed.countDocuments({ guildId });
      if (count >= EMBED_LIMIT) {
        return res.status(400).json({
          error: `You have reached the limit of ${EMBED_LIMIT} embeds.`,
        });
      }

      // Check Uniqueness
      const existing = await Embed.findOne({ guildId, code });
      if (existing) {
        return res.status(400).json({
          error: "An embed with this code already exists in this server.",
        });
      }

      const embed = new Embed({
        guildId,
        name,
        code,
        embedData,
      });

      await embed.save();

      // Log activity
      if (user) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "embed_create",
          action: `Created new embed: ${name} (${code})`,
          details: { embedId: embed._id, name, code },
        }).save();
      }

      res.status(201).json(embed);
    } catch (error) {
      logger.error("Error creating embed:", error);
      res.status(500).json({ error: "Failed to create embed" });
    }
  }
);

// =======================
// Update Embed
// =======================
router.patch(
  "/guild/:guildId/:embedId",
  checkGuildPermission("embeds"),
  async (req, res) => {
    try {
      const { guildId, embedId } = req.params;
      const { name, code, embedData } = req.body;
      const authHeader = req.headers.authorization;

      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );

      // Check Uniqueness if code changed
      if (code) {
        const existing = await Embed.findOne({
          guildId,
          code,
          _id: { $ne: embedId },
        });
        if (existing) {
          return res.status(400).json({
            error: "An embed with this code already exists in this server.",
          });
        }
      }

      // Get old embed to check for file cleanup
      const oldEmbed = await Embed.findOne({ _id: embedId, guildId });
      if (!oldEmbed) {
        return res.status(404).json({ error: "Embed not found." });
      }

      // Update
      const embed = await Embed.findOneAndUpdate(
        { _id: embedId, guildId },
        { name, code, embedData },
        { new: true, runValidators: true }
      );

      // Cleanup files
      if (embedData) {
        cleanupEmbedFiles(oldEmbed, embedData);
      }

      // Log activity
      if (user) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "embed_update",
          action: `Updated embed: ${name} (${code})`,
          details: { embedId, name, code },
        }).save();
      }

      res.json(embed);
    } catch (error) {
      logger.error("Error updating embed:", error);
      res.status(500).json({ error: "Failed to update embed" });
    }
  }
);

// =======================
// Delete Embed
// =======================
router.delete(
  "/guild/:guildId/:embedId",
  checkGuildPermission("embeds"),
  async (req, res) => {
    try {
      const { guildId, embedId } = req.params;
      const authHeader = req.headers.authorization;

      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );

      const embedToDelete = await Embed.findOne({ _id: embedId, guildId });
      if (!embedToDelete) {
        return res.status(404).json({ error: "Embed not found." });
      }

      // Cleanup files (pass null as new data to delete all local files)
      cleanupEmbedFiles(embedToDelete, null);

      await Embed.deleteOne({ _id: embedId, guildId });

      // Log activity
      if (user) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "embed_delete",
          action: `Deleted embed: ${embedToDelete.name} (${embedToDelete.code})`,
          details: {
            embedId,
            name: embedToDelete.name,
            code: embedToDelete.code,
          },
        }).save();
      }

      res.json({ message: "Embed deleted successfully" });
    } catch (error) {
      logger.error("Error deleting embed:", error);
      res.status(500).json({ error: "Failed to delete embed" });
    }
  }
);

module.exports = router;
