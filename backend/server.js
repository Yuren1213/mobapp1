import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js"; // auth routes
import cartRoutes from "./routes/cart.js"; // your cart routes
import favoritesRoutes from "./routes/favoriteRoute.js"; // favorites routes
import orderRoutes from "./routes/orderRoutes.js";
import productsRoutes from "./routes/productsRoute.js"; // your existing product routes
import bentoRoutes from "./routes/bento.js";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve uploads folder
app.use("/uploads", express.static("uploads"));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB connection failed:", err.message));

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/bento", bentoRoutes);



app.get("/", (req, res) => res.send("🚀 Server is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
