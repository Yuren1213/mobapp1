// backend/models/Bento.js
import mongoose from "mongoose";

const BentoSchema = new mongoose.Schema(
  {
    bento_desc: { type: String, required: true },
    bento_price: { type: Number, required: true },
    bento_image: { type: String }, // stored as "/uploads/filename.jpg"
  },
  { timestamps: true }
);

// Virtual field to auto-generate a full image URL
BentoSchema.virtual("image_url").get(function () {
  return this.bento_image
    ? `${process.env.BASE_URL || "http://localhost:5000"}${this.bento_image}`
    : null;
});

BentoSchema.set("toJSON", { virtuals: true }); // include virtual field in JSON

export default mongoose.model("Bento", BentoSchema);
