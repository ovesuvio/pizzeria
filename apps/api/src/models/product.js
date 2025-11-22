const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  categoryId: String,
  subcategory: String,
  photoUrl: String,
  available: { type: Boolean, default: true },
  ingredients: [String],
  extras: [{ name: String, price: Number }],
});

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);