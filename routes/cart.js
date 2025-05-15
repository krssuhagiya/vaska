const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const Product = require("../models/product"); 
const Order = require("../models/order");
const auth = require("../middleware/auth");

// Protected routes that require authentication
router.use(['/orders', '/checkout', '/thank-you'], auth);

// Add product to cart
router.post("/add-to-cart", auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Fetch product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if product already exists in user's cart
    let cartItem = await Cart.findOne({ product: productId, user: userId });
    
    if (cartItem) {
      // If product exists, increment quantity
      cartItem.quantity = (cartItem.quantity || 1) + 1;
      if (cartItem.quantity > 10) {
        return res.status(400).json({ error: "Maximum quantity limit reached" });
      }
      await cartItem.save();
    } else {
      // If product doesn't exist, create new cart item
      cartItem = new Cart({
        user: userId,
        product: productId,
        priceAtAddition: product.price,
        quantity: 1
      });
      await cartItem.save();
    }

    res.json({ message: "Product added to cart successfully!" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update quantity
router.post("/cart/update-quantity/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { change } = req.body;
    const userId = req.user._id;

    console.log('Received update request:', { productId, change, body: req.body });

    const cartItem = await Cart.findOne({ product: productId, user: userId });
    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // Calculate new quantity
    const newQuantity = (cartItem.quantity || 1) + parseInt(change);

    console.log('Calculated new quantity:', newQuantity);

    // Validate quantity limits
    if (newQuantity < 1) {
      return res.status(400).json({ error: "Quantity cannot be less than 1" });
    }
    if (newQuantity > 10) {
      return res.status(400).json({ error: "Maximum quantity limit reached" });
    }

    // Update quantity
    cartItem.quantity = newQuantity;
    await cartItem.save();

    console.log('Successfully updated quantity to:', newQuantity);
    res.json({ success: true, quantity: newQuantity });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove item from cart
router.post("/cart/remove/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    
    const result = await Cart.findOneAndDelete({ product: productId, user: userId });
    if (!result) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch and render cart page
router.get("/cart", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const cartItems = await Cart.find({ user: userId }).populate("product");
    res.render("cart", { cart: cartItems });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Checkout Route (Process Payment)
router.post("/checkout", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Checkout initiated by user:', userId);

    const cartItems = await Cart.find({ user: userId }).populate("product");
    console.log('Cart items found:', cartItems.length);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total amount including quantities
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.priceAtAddition || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + (price * quantity);
    }, 0);

    console.log('Calculated total amount:', totalAmount);

    // Create new order with user reference
    const newOrder = new Order({
      user: userId,
      products: cartItems.map(item => ({
        product: item.product._id,
        priceAtOrder: parseFloat(item.priceAtAddition || 0),
        quantity: parseInt(item.quantity || 1)
      })),
      totalAmount: parseFloat(totalAmount),
      status: 'processing'
    });

    console.log('Created new order:', newOrder);

    await newOrder.save();
    console.log('Order saved successfully');

    // Clear User's Cart After Checkout
    await Cart.deleteMany({ user: userId });
    console.log('Cart cleared for user:', userId);

    // Redirect to Thank You Page
    res.redirect("/thank-you");

  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message,
      userId: req.user?._id
    });
  }
});

// thank you
router.get("/thank-you", (req, res) => {
  res.render("thank-you", { user: req.user });
});

// Get orders page
router.get("/orders", async (req, res) => {
  try {
    console.log('Debug: Accessing orders page');
    console.log('User ID:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.log('No user found in request');
      return res.redirect('/login?redirect=/orders');
    }

    // Fetch orders with debug logging
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: 'products.product',
        model: 'Product',
        select: 'productName image price' // Specify the fields we need
      })
      .sort({ createdAt: -1 });

    console.log('Found orders:', orders.length);
    
    // Log detailed order information
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log('Order ID:', order._id);
      console.log('Total Amount:', order.totalAmount);
      console.log('Status:', order.status);
      console.log('Products:', order.products.map(p => ({
        productId: p.product?._id,
        productName: p.product?.productName,
        quantity: p.quantity,
        priceAtOrder: p.priceAtOrder
      })));
    });

    // Add try-catch in the template to catch any rendering errors
    res.render("orders", { 
      orders, 
      user: req.user,
      debug: {
        hasUser: !!req.user,
        userId: req.user._id,
        orderCount: orders.length,
        firstOrder: orders[0] ? {
          id: orders[0]._id,
          totalAmount: orders[0].totalAmount,
          productCount: orders[0].products.length,
          sampleProduct: orders[0].products[0] ? {
            name: orders[0].products[0].product?.productName,
            price: orders[0].products[0].priceAtOrder,
            quantity: orders[0].products[0].quantity
          } : null
        } : null,
        allOrders: orders.map(order => ({
          id: order._id,
          totalAmount: order.totalAmount,
          productCount: order.products.length,
          status: order.status
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.render("orders", { 
      orders: [], 
      user: req.user,
      error: error.message,
      debug: {
        error: error.message,
        stack: error.stack
      }
    });
  }
});

module.exports = router;
