const { Schema, model } = require('mongoose');

module.exports = model('User', new Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true }));
