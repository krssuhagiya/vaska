const express = require("express");
const router = express.Router();
const Category = require("../models/categories");

// Get all categories
router.get("/get-categories", async (req, res) => {
    try {
        const categories = await Category.find().sort({ categoryGender: 1, categoryName: 1 });
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add new category (Admin only)
router.post("/add-category", async (req, res) => {
    try {
        const { categoryName, categoryGender } = req.body;
        
        // Validate input
        if (!categoryName || !categoryGender) {
            return res.status(400).json({ error: "Category name and gender are required" });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            categoryName: categoryName.trim(),
            categoryGender: categoryGender
        });

        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }

        // Create new category
        const newCategory = new Category({
            categoryName: categoryName.trim(),
            categoryGender: categoryGender
        });

        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete category (Admin only)
router.delete("/delete-category/:id", async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router; 