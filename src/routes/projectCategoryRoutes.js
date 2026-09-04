

import express from 'express';
import ProjectCategory from '../models/ProjectCategory.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const categories = await ProjectCategory.find({}).sort({ name: 1 });
    

    res.json({
      success: true,
      message: 'Categories fetched successfully',
      count: categories.length,
      data: categories  
    });
  } catch (error) {
    console.error(' Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});


router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const category = await ProjectCategory.create({
      name,
      description,
      slug: name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
       category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await ProjectCategory.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const category = await ProjectCategory.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );
      
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;