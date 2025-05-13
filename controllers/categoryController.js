const Category = require('../models/Category');

//create new category
exports.createCategory = async (req, res, next) => {
  try {
    //add user to req.body
    req.body.user = req.user.id;
    
    const category = await Category.create(req.body);
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    //handle duplicate category error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name and type already exists'
      });
    }
    next(error);
  }
};

//get all categories for user
exports.getCategories = async (req, res, next) => {
  try {
    //add filter options
    const filter = { user: req.user.id };
    
    //filter by type if provided
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    const categories = await Category.find(filter);
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

//get specific category by ID
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    //check user owns the category
    if (category.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this category'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

//update category by ID
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    //check user owns the category
    if (category.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category'
      });
    }
    
    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    //handle duplicate category error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name and type already exists'
      });
    }
    next(error);
  }
};

//delete category by ID
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    //check user owns the category
    if (category.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this category'
      });
    }
    
    await category.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
