import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: false },
  title: String,
  price: Number,
  image: String,
  quantity: { type: Number, default: 1 },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  items: [ItemSchema],
  totalAmount: Number,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  city: String,
  barangay: String,
  resetToken: String,
  resetExpires: Date,
  cart: [ItemSchema],
  orders: [OrderSchema],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
    