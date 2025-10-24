import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ✅ Get user cart
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("cart name");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ items: user.cart || [], name: user.name || "Guest" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Add item to cart
router.post("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { item } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = user.cart.find(
      (i) =>
        (i.productId && item.productId && i.productId.toString() === item.productId) ||
        i.title === item.title
    );

    if (existing) existing.quantity += item.quantity || 1;
    else user.cart.push({ ...item, quantity: item.quantity || 1 });

    await user.save();
    res.json({ message: "Item added", items: user.cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Update whole cart
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { items } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.cart = items || [];
    await user.save();

    res.json({ message: "Cart updated", items: user.cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Remove specific item
router.delete("/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.cart = user.cart.filter((item) => item.productId?.toString() !== productId);
    await user.save();

    res.json({ message: "Item removed", items: user.cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Clear cart
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.cart = [];
    await user.save();

    res.json({ message: "Cart cleared", items: [] });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
