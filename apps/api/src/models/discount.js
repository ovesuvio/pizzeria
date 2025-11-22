const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  percentage: Number,
  active: { type: Boolean, default: true },
  minTotal: { type: Number, default: 0 },
});

module.exports = mongoose.models.Discount || mongoose.model('Discount', DiscountSchema);