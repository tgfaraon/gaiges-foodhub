const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  email: String,
  password: {
  type: String,
  required: true,
  select: false
},
  avatarUrl: String,
  badges: [String],
  savedItems: [Object],
  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  }
});

module.exports = mongoose.model('User', userSchema);