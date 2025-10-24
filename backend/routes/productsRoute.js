// routes/productsRoute.js
import express from "express";
import multer from "multer";
import path from "path";
import Product from "../models/Product.js";

const router = express.Router();

// 🗂️ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 🟢 GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    console.error("❌ Error fetching products:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 POST new product (with image upload)
router.post("/", upload.single("product_image"), async (req, res) => {
  try {
    const { prod_desc, prod_unit_price } = req.body;

    if (!prod_desc || !prod_unit_price) {
      return res.status(400).json({
        success: false,
        message: "Product description and price are required",
      });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newProduct = new Product({
      prod_desc,
      prod_unit_price,
      product_image: imagePath,
    });

    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error("❌ Error adding product:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟡 PUT update product
router.put("/:id", upload.single("product_image"), async (req, res) => {
  try {
    const { prod_desc, prod_unit_price } = req.body;
    const updateData = { prod_desc, prod_unit_price };

    if (req.file) updateData.product_image = `/uploads/${req.file.filename}`;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, product: updatedProduct });
  } catch (err) {
    console.error("❌ Error updating product:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🔴 DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting product:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
