import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',        
        issuer: 'rdeens-api',   
        audience: 'admin'       
      }
    );

    res.cookie('token', token, {
      httpOnly: true,            
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',        
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,              
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(' Login Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, please try again later' 
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(' Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const logoutAdmin = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0  
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error(' Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export { loginAdmin, getProfile, logoutAdmin };