import mongoose from "mongoose";

const FavoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    foodId: { type: String, required: true },
    title: String,
    price: Number,
    image: String,
  },
  { timestamps: true }
);

export default mongoose.model("Favorite", FavoriteSchema);
