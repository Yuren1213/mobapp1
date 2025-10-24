// models/Product.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    prod_desc: { type: String, required: true },
    prod_unit_price: { type: Number, required: true },
    product_image: { type: String }, // stored as "/uploads/filename.jpg"
  },
  { timestamps: true }
);

// Virtual field to automatically generate an image URL
ProductSchema.virtual("image_url").get(function () {
  return this.product_image
    ? `${process.env.BASE_URL || "http://localhost:5000"}${this.product_image}`
    : null;
});

ProductSchema.set("toJSON", { virtuals: true }); // include virtuals in JSON

export default mongoose.model("Product", ProductSchema);
