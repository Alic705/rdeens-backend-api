import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({

  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: 100
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    minlength: 10,
    maxlength: 200
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },


  thumbnail: {
    type: String,
    required: [true, 'Thumbnail is required']
  },

  images: [{
    type: String,
    trim: true
  }],


  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectCategory',
    required: true
  },

  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  client: {
    type: String,
    trim: true,
    maxlength: 100
  },

  liveUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Live URL must be valid (http/https)'
    }
  },

  technologies: [{
    type: String,
    trim: true
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, {
  timestamps: true
});


projectSchema.pre('save', async function () {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 200);
  }
});




const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default Project;