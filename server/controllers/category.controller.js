import Category from '../models/Category.js';
import Service from '../models/Service.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all categories (new function)
export const getAllCategories = async (req, res) => {
  try {
    console.log('Fetching all categories');
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    
    res.json({
      categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      message: 'Error fetching categories',
      error: error.message 
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Count services in this category
    const serviceCount = await Service.countDocuments({ category: req.params.id, status: 'active' });
    
    res.json({
      ...category.toJSON(),
      serviceCount
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, description, icon, sortOrder } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Check for duplicates
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(409).json({ message: 'A category with this name already exists' });
    }
    
    let imageUrl = '';
    
    // Upload image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path);
      imageUrl = result.secure_url;
    }
    
    const category = new Category({
      name,
      description,
      icon,
      imageUrl,
      sortOrder: parseInt(sortOrder) || 0,
      createdBy: req.user.id
    });
    
    await category.save();
    
    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, sortOrder, status } = req.body;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check for duplicates if name is changed
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return res.status(409).json({ message: 'A category with this name already exists' });
      }
    }
    
    // Update fields if provided
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (sortOrder !== undefined) category.sortOrder = parseInt(sortOrder) || 0;
    if (status && ['active', 'inactive'].includes(status)) category.status = status;
    
    // Upload image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path);
      category.imageUrl = result.secure_url;
    }
    
    await category.save();
    
    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if services use this category
    const serviceCount = await Service.countDocuments({ category: id });
    
    if (serviceCount > 0) {
      await Service.updateMany({ category: id }, { $unset: { category: 1 } });
    }
    
    await category.deleteOne();
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: error.message });
  }
};
