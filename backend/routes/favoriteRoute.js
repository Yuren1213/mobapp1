import express from "express";
import User from "../models/user.js";

const router = express.Router();

// ➕ Add favorite
router.post("/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      await user.save();
    }

    res.json({ success: true, message: "Added to favorites", favorites: user.favorites });
  } catch (err) {
    console.error("❌ Add favorite error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ❌ Remove favorite
router.delete("/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.favorites = user.favorites.filter((id) => id.toString() !== productId);
    await user.save();

    res.json({ success: true, message: "Removed from favorites", favorites: user.favorites });
  } catch (err) {
    console.error("❌ Remove favorite error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 📦 Get all favorites
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("favorites");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    console.error("❌ Get favorites error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
