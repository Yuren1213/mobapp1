import express from "express";
import Order from "../models/Order.js";
import User from "../models/User.js";

const router = express.Router();

// Create a new order
router.post("/", async (req, res) => {
  try {
    const {
      userId, name, email, items, subtotal, shippingFee, total,
      contactNumber, blk, lot, city, province, zipcode, barangay
    } = req.body;

    if (!userId || !name || !items?.length) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const order = new Order({
      userId,
      name,
      email,
      items,
      subtotal,
      shippingFee,
      total,
      contactNumber,
      blk,
      lot,
      city,
      province,
      zipcode,
      barangay
    });

    await order.save();

    res.status(201).json({ success: true, message: "Order created successfully", order });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// Get all orders for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Cancel a specific order
router.patch("/:userId/:orderId/cancel", async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = "Cancelled";
    await order.save();

    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
