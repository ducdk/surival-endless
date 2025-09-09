const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  gameData: {
    character: {
      maxHealth: { type: Number, default: 500 },
      damage: { type: Number, default: 50 },
      speed: { type: Number, default: 6 },
      level: { type: Number, default: 1 },
      experience: { type: Number, default: 0 },
      experienceToNextLevel: { type: Number, default: 100 },
      gold: { type: Number, default: 0 }
    },
    inventory: [
      {
        type: { type: String },
        level: { type: Number }
      }
    ],
    skills: [
      {
        name: { type: String },
        currentLevel: { type: Number }
      }
    ]
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Check password validity
userSchema.methods.isValidPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
