const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  address: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Wallet", WalletSchema);