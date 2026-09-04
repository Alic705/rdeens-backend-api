import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 100
  },
  

  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  

  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
    default: 5
  },

  logo: {
    type: String,
    default: null
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true  
});

// Indexes 
testimonialSchema.index({ status: 1, order: 1, createdAt: -1 });
testimonialSchema.index({ isFeatured: 1 });
testimonialSchema.index({ rating: -1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;