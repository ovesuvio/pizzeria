const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title: String,
  content: String,
  imageUrl: String,
  active: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.News || mongoose.model('News', NewsSchema);