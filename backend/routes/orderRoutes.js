import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";

const router = express.Router();

// --------------------------
// Create a new order
// --------------------------
router.post("/", async (req, res) => {
  try {
    const {
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
      barangay,
    } = req.body;

    if (!userId || !name || !items?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

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
      barangay,
      status: "Pending", // default status
    });

    await order.save();

    res
      .status(201)
      .json({ success: true, message: "Order created successfully", order });
  } catch (err) {
    console.error("Error creating order:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// --------------------------
// Get all orders for a user
// --------------------------
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------------
// Cancel a specific order
// --------------------------
router.patch("/:userId/:orderId/cancel", async (req, res) => {
  try {
    const { userId, orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user or order ID" });
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "Cancelled") {
      return res.json({ success: true, message: "Order already cancelled", order });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (err) {
    console.error("Error cancelling order:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
