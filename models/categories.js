const mongoose = require("mongoose"); 
const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  categoryGender: {
    type: String,
    enum: ["Men", "Women"],
    required: true
  }
}, { timestamps: true });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
