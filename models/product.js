const mongoose = require("mongoose"); 
const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to Category
    ref: "Category",
    required: true,
  },
  gender: {
    type:String,
    enum:["Men","Women"],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number, // Percentage discount (e.g., 10 for 10% off)
    default: 0,
    min: 0,
    max: 100,
  },
  image: {
    type: String, // Stores image path
    required: true,
  },
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
