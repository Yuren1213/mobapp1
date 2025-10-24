import express from "express";
import axios from "axios";

const router = express.Router();

// Load secret key from environment variables
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

if (!PAYMONGO_SECRET_KEY) {
  console.error("PAYMONGO_SECRET_KEY is missing in .env");
}

// Create GCash Payment Intent
router.post("/gcash", async (req, res) => {
  const { total } = req.body;

  console.log("Incoming total:", total);

  if (!total || total <= 0) {
    return res.status(400).json({ error: "Invalid total amount" });
  }

  try {
    // Prepare request payload
    const payload = {
      data: {
        attributes: {
          amount: total * 100, // PHP → centavos
          currency: "PHP",
          payment_method_types: ["gcash"],
        },
      },
    };

    console.log("Sending to PayMongo:", JSON.stringify(payload, null, 2));

    // Axios call to PayMongo
    const response = await axios.post(
      "https://api.paymongo.com/v1/payment_intents",
      payload,
      {
        headers: {
          Authorization: "Basic " + Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64"),
          "Content-Type": "application/json",
        },
      }
    );    

    console.log("PayMongo response:", response.data);

    const checkoutUrl = response.data.data.attributes.next_action.redirect.checkout_url;

    res.json({ checkoutUrl });
  } catch (err) {
    console.error("Axios error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to create GCash payment",
      details: err.response?.data || err.message,
    });
  }
});

export default router;
