require('dotenv').config();
const express = require("express");
const path = require("path");
const app = express();
const userModel = require("./models/users");
const categoryModel = require("./models/categories");
const productModel = require("./models/product");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const Category = require("./models/categories");
const multer = require("multer");
const mongoose = require("mongoose");
const cartRoutes = require("./routes/cart");
const adminRoutes = require("./routes/admin"); // Admin Panel
const auth = require("./middleware/auth");

const connectDB = require('./models/db');
connectDB()
const session = require("express-session");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use(session({ secret: "secretkey", resave: false, saveUninitialized: true }));

// Protected routes should use auth middleware
app.use('/orders', auth);
app.use('/checkout', auth);

// Add middleware to make user available to all views
app.use(async (req, res, next) => {
  if (req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, 'shhh');
      const user = await userModel.findById(decoded.userid);
      res.locals.user = user;
      req.user = user; // Also set req.user for compatibility
    } catch (error) {
      res.locals.user = null;
      req.user = null;
    }
  } else {
    res.locals.user = null;
    req.user = null;
  }
  next();
});

// Mount cart routes
app.use('/', cartRoutes);
app.use('/', adminRoutes);

// Add middleware to include path in all renders
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save images in "uploads" folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("home");
});
app.get("/men", async (req, res) => {
  try {
    const products = await productModel.find({ gender: "Men" }); // Fetch men's products from DB
    res.render("men", { products }); // Pass products to the EJS template
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/women", async (req, res) => {
  try {
    const products = await productModel.find({ gender: "Women" }); // Fetch women's products from DB
    res.render("women", { products }); // Pass products to the EJS template
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/bride", (req, res) => {
  res.render("bride");
});
app.get("/groom", (req, res) => {
  res.render("groom");
});
app.get("/wedding", (req, res) => {
  res.render("wedding");
});
app.get("/sale", (req, res) => {
  res.render("sale");
});
app.get("/login", (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/');
  }
  res.render("login", { error: null, user: res.locals.user });
});
app.get("/signup", (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/');
  }
  res.render("signup", { error: null, user: res.locals.user });
});
app.get("/admin/dashboard", (req, res) => {
  res.render("./backendviews/dashboard");
});
app.get("/admin/categories", (req, res) => {
  res.render("./backendviews/categories");
});
app.get("/admin/product", (req, res) => {
  res.render("./backendviews/product");
});
app.get("/admin/order", (req, res) => {
  res.render("./backendviews/order");
});
app.get("/aboutus", (req, res) => {
  res.render("aboutus");
});
app.get("/corporateinfo", (req, res) => {
  res.render("corporateinfo");
});
app.get("/termandcondition", (req, res) => {
  res.render("termandcondition");
});
app.get("/privacypolicy", (req, res) => {
  res.render("privacypolicy");
});
app.get("/cookiepolicy", (req, res) => {
  res.render("cookiepolicy");
});
app.get("/shippingpolicy", (req, res) => {
  res.render("shippingpolicy");
});
app.get("/orderandshipment", (req, res) => {
  res.render("orderandshipment");
});
app.get("/returnandexchange", (req, res) => {
  res.render("returnandexchange");
});
app.get("/contact", (req, res) => {
  res.render("contact");
});
app.get("/FAQs", (req, res) => {
  res.render("FAQs");
});
app.get("/gifts", (req, res) => {
  res.render("gifts");
});
app.get("/store-locator", (req, res) => {
  res.render("storelocator");
});
app.get("/sitemap", (req, res) => {
  res.render("sitemap");
});
app.get("/cart", (req, res) => {
  res.render("cart");
});

// Search API endpoint
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json([]);
    }

    const products = await productModel.find({
      $or: [
        { productName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    res.json(products);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// category
app.get("/category/:category", async (req, res) => {
  try {
    let category = req.params.category;

    // Convert to ObjectId only if your schema uses ObjectId
    if (mongoose.Types.ObjectId.isValid(category)) {
      category = new mongoose.Types.ObjectId(category);
    }

    const products = await productModel.find({ category });
    res.render("category", { products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Server Error");
  }
});

// Authentication Routes
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.render("signup", { error: "All fields are required", user: res.locals.user });
    }

    if (password !== confirmPassword) {
      return res.render("signup", { error: "Passwords do not match", user: res.locals.user });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.render("signup", { error: "Email already registered", user: res.locals.user });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with explicit role
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      role: 'user'  // Explicitly set role to 'user'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userid: user._id, email: user.email },
      'shhh',
      { expiresIn: '24h' }
    );

    // Set cookie and redirect
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.redirect('/');
  } catch (error) {
    console.error('Signup error:', error);
    res.render("signup", { error: "Error creating account", user: res.locals.user });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.render("login", { error: "All fields are required", user: res.locals.user });
    }

    // Find user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.render("login", { error: "Invalid credentials", user: res.locals.user });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", { error: "Invalid credentials", user: res.locals.user });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userid: user._id, email: user.email },
      'shhh',
      { expiresIn: '24h' }
    );

    // Set cookie and redirect
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Redirect based on role
    if (user.role === 'admin') {
      res.redirect('/get-products');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render("login", { error: "Error logging in", user: res.locals.user });
  }
});

// Logout route
app.get("/logout", (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// Protected Routes Middleware
const protectRoute = (req, res, next) => {
  if (!req.cookies.token) {
    return res.redirect('/login');
  }
  next();
};

// Apply protection to routes that require authentication
app.get("/profile", protectRoute, async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, 'shhh');
    const user = await userModel.findById(decoded.userid);
    res.render("profile", { user });
  } catch (error) {
    res.redirect('/login');
  }
});

// categories
app.post("/create-category", async (req, res) => {
  try {
    const { categoryName, categoryGender } = req.body;
    const newCategory = new categoryModel({ categoryName, categoryGender });
    await newCategory.save();

    res.json({
      success: true,
      message: "Category added successfully!",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
});

app.get("/get-category", async (req, res) => {
  try {
    const categories = await categoryModel.find();
    res.render("./backendviews/categories", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});
app.get("/get-categories", async (req, res) => {
  try {
    const categories = await categoryModel.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});
app.delete("/delete-category/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category" });
  }
});
app.put("/update-category/:id", async (req, res) => {
  try {
    const { categoryName, categoryGender } = req.body;
    const categoryId = req.params.id;

    if (!categoryName || !categoryGender) {
      return res
        .status(400)
        .json({ message: "Both category name and gender are required." });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { categoryName, categoryGender },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json({
      message: "Category updated successfully.",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
}); 
app.get("/get-product", async (req, res) => {
  try {
    const products = await productModel.find().populate("category");
    res.json(products);
  } catch (error) {
    res.status(500).send("Error fetching products");
  }
});
 
app.post("/create-product", upload.single("image"), async (req, res) => {
  try {
    const { productName, category, price, gender, discount } = req.body;
    const image = req.file ? req.file.path : null; // Get image path

    // Validate required fields
    if (
      !productName ||
      !category ||
      !price ||
      !image ||
      !gender
    ) {
      return res
        .status(400)
        .json({ message: "All fields including image are required" });
    }

    // Create a new product with the category ID directly
    const product = await productModel.create({
      productName,
      category, // This is already the category ID from the form
      price,
      image,
      gender,
      discount: discount || 0,
    });

    res.status(201).redirect("/get-products");
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});
app.get("/get-products", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.redirect('/');
    }
    
    const products = await productModel.find().populate("category");
    const categories = await categoryModel.find();
    res.render("./backendviews/product", { products, categories });
  } catch (error) {
    res.status(500).send("Error fetching products: " + error.message);
  }
});
app.get("/edit-product/:id", async (req, res) => {
  try {
    const products = await productModel.findById(req.params.id).populate("category");
    const categories = await categoryModel.find();

    res.render("./backendviews/editProduct", { products, categories });
  } catch (error) {
    console.error("Error fetching product for edit:", error);
    res.status(500).send("Error fetching product: " + error.message);
  }
});
app.post("/update-product/:id", upload.single("image"), async (req, res) => {
  try {
    const { productName, category, gender, price, discount } = req.body;
    
    // Build the update data object
    const updateData = { 
      productName, 
      gender, 
      price, 
      discount: discount || 0 
    };

    // Set category as ObjectId
    if (category) {
      updateData.category = category; // It's already the category ID from the form
    }

    // Add image if provided
    if (req.file) {
      updateData.image = req.file.path;
    }

    await productModel.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/get-products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product: " + error.message);
  }
});
app.post("/delete-product/:id", async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.id);
    res.redirect("/get-products");
  } catch (error) {
    res.status(500).send("Error deleting product: " + error.message);
  }
});

app.get("/get-sales", async (req, res) => {
  try {
    // Fetch only products that have a discount
    const products = await productModel
      .find({ discount: { $gt: 0 } })
      .populate("category");
    const categories = await categoryModel.find();

    res.render("./backendviews/sale", { products, categories });
  } catch (error) {
    res
      .status(500)
      .send("Error fetching discounted products: " + error.message);
  }
});
app.get("/get-sale", async (req, res) => {
  try {
    // Fetch only products that have a discount
    const products = await productModel
      .find({ discount: { $gt: 0 } })
      .populate("category");
    const categories = await categoryModel.find();

    res.json(products);
  } catch (error) {
    res
      .status(500)
      .send("Error fetching discounted products: " + error.message);
  }
});

app.get("/get-orders", async (req, res) => {
  try {
    const orders = await orderModel.find().populate("product");
    res.render("./backendviews/orders", { orders });
  } catch (error) {
    res.status(500).send("Error fetching orders: " + error.message);
  }
});
app.get("/get-order", async (req, res) => {
  try {
    const orders = await orderModel.find().populate("product");
    res.json(orders);
  } catch (error) {
    res.status(500).send("Error fetching orders: " + error.message);
  }
});

app.get("/search", async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const category = req.query.category;
    const gender = req.query.gender;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE;

    if (!searchQuery && !category && !gender) {
      return res.json([]);
    }

    // Build the search query
    let searchCriteria = {};

    if (searchQuery) {
      searchCriteria.$or = [
        { productName: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    if (category) {
      searchCriteria.category = category;
    }

    if (gender) {
      searchCriteria.gender = gender;
    }

    searchCriteria.price = {
      $gte: minPrice,
      $lte: maxPrice
    };

    // Search products with all criteria
    const products = await productModel.find(searchCriteria)
      .populate('category')
      .sort({ price: 1 }); // Sort by price ascending

    res.json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Error searching products" });
  }
});

app.get("/product/:id", async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id).populate("category");
    res.render("product", { product }); 
  } catch (error) {
    res.status(500).send("Error fetching product");
  }
});

// Update the isLoggedIn middleware to use our auth middleware
const isLoggedIn = auth;

// Route to toggle like status
app.post('/toggle-like', auth, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;

        // Validate productId
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        // Find user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if product exists
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if product is already liked
        const isLiked = user.likedProducts.includes(productId);

        if (isLiked) {
            // Remove from liked products
            user.likedProducts = user.likedProducts.filter(id => id.toString() !== productId);
        } else {
            // Add to liked products
            user.likedProducts.push(productId);
        }

        await user.save();

        res.json({ 
            success: true, 
            message: isLiked ? 'Product removed from wishlist' : 'Product added to wishlist',
            isLiked: !isLiked
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Failed to update wishlist', details: error.message });
    }
});

// Route to get liked products
app.get('/get-liked-products', auth, async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).populate('likedProducts');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.likedProducts);
    } catch (error) {
        console.error('Error fetching liked products:', error);
        res.status(500).json({ error: 'Failed to fetch liked products' });
    }
});

// Route to render liked products page
app.get("/liked", auth, async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).populate('likedProducts');
        res.render("liked", { likedProducts: user.likedProducts });
    } catch (error) {
        console.error('Error fetching liked products:', error);
        res.status(500).send('Error fetching liked products');
    }
});

app.post("/add-to-cart", async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Check if product already exists in cart
        const existingItem = req.session.cart.find(item => item.productId.toString() === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            req.session.cart.push({
                productId,
                quantity: 1,
                product: product
            });
        }

        res.json({ 
            success: true, 
            message: "Product added to cart",
            cartCount: req.session.cart.length
        });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ error: "Failed to add to cart" });
    }
});

app.post("/update-cart", async (req, res) => {
    try {
        const { productId, action } = req.body;
        
        if (!req.session.cart) {
            return res.redirect("/cart");
        }

        const item = req.session.cart.find(item => item.productId.toString() === productId);
        
        if (item) {
            if (action === "increase") {
                item.quantity += 1;
            } else if (action === "decrease") {
                item.quantity -= 1;
                if (item.quantity < 1) {
                    req.session.cart = req.session.cart.filter(i => i.productId.toString() !== productId);
                }
            }
        }

        res.redirect("/cart");
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).send("Error updating cart");
    }
});

app.post("/remove-from-cart", async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (req.session.cart) {
            req.session.cart = req.session.cart.filter(item => item.productId.toString() !== productId);
        }

        res.redirect("/cart");
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).send("Error removing from cart");
    }
});

app.get("/debug-auth", (req, res) => {
  res.json({
    hasToken: !!req.cookies.token,
    token: req.cookies.token,
    user: res.locals.user,
    isAuthenticated: !!res.locals.user
  });
});

app.listen(3000,'0.0.0.0');


