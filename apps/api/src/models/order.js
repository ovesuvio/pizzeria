const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: String,
  items: [{ productId: String, quantity: Number, extras: [{ name: String, price: Number }] }],
  total: Number,
  mode: { type: String, enum: ['pickup', 'delivery'] },
  address: String,
  scheduledAt: String,
  paymentMethod: { type: String, enum: ['stripe', 'visa', 'paypal', 'cash'] },
  status: { type: String, default: 'ricevuto' },
  customerFirstName: String,
  customerLastName: String,
  customerPhone: String,
  customerEmail: String,
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);