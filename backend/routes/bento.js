// backend/routes/bento.js
import express from "express";
import multer from "multer";
import path from "path";
import Bento from "../models/Bento.js"; 

const router = express.Router();

// 🗂️ Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 🟢 GET all Bento meals
router.get("/", async (req, res) => {
  try {
    const bentos = await Bento.find().sort({ createdAt: -1 });
    res.json({ success: true, bentos });
  } catch (err) {
    console.error("❌ Error fetching Bento meals:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 POST new Bento meal (with image upload)
router.post("/", upload.single("bento_image"), async (req, res) => {
  try {
    const { bento_desc, bento_price } = req.body;

    if (!bento_desc || !bento_price) {
      return res.status(400).json({
        success: false,
        message: "Description and price are required",
      });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newBento = new Bento({
      bento_desc,
      bento_price,
      bento_image: imagePath,
    });

    await newBento.save();
    res.status(201).json({ success: true, bento: newBento });
  } catch (err) {
    console.error("❌ Error adding Bento:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟡 PUT update Bento meal
router.put("/:id", upload.single("bento_image"), async (req, res) => {
  try {
    const { bento_desc, bento_price } = req.body;
    const updateData = { bento_desc, bento_price };

    if (req.file) updateData.bento_image = `/uploads/${req.file.filename}`;

    const updatedBento = await Bento.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBento)
      return res.status(404).json({ success: false, message: "Bento not found" });

    res.json({ success: true, bento: updatedBento });
  } catch (err) {
    console.error("❌ Error updating Bento:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🔴 DELETE Bento meal
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Bento.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Bento not found" });
    res.json({ success: true, message: "Bento deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting Bento:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
