const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: String,
  address: String,
  passwordHash: String,
  isAdmin: { type: Boolean, default: false },
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);