const express = require("express");
const router = express.Router();
const Order = require("../models/order");

// Get All Orders (Admin View)
router.get("/get-orders", async (req, res) => {
  try {
    const orders = await Order.find().populate("products.product");
    res.render("./backendviews/orders", { orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Confirm Order Route
router.put("/confirm-order/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findByIdAndUpdate(orderId, { status: "Confirmed" }, { new: true });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order confirmed successfully!", order });
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
