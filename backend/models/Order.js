import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  title: String,
  price: Number,
  image: String,
  quantity: { type: Number, default: 1 },
});

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: String,
    contactNumber: String,
    blk: String,
    lot: String,
    city: String,
    province: String,
    zipcode: String,
    barangay: String,
    items: [ItemSchema],
    subtotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, default: "Pending" }, // Pending / Rejected / Cancelled / Completed
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
