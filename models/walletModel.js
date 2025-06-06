const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "deposit",          // User adding funds
      "withdrawal",       // User taking funds out
      "bet_placement",    // Funds deducted for placing a bet
      "bet_win_payout",   // Winnings credited from a bet
      "bet_refund",       // Bet stake returned (e.g., void event)
      "admin_credit",     // Manual credit by admin
      "admin_debit",      // Manual debit by admin      
      "bonus_credit",     // Bonus funds added
      "wallet_top_up_bank_transfer",
      "wallet_top_up" // For direct bank transfers via webhook
    ]
  },
  amount: { // Always positive. The 'type' of transaction determines its effect on balance.
    type: Number,
    required: true,
    min: [0, "Transaction amount cannot be negative."]
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled"],
    default: "pending",
    required: true
  },
  referenceId: { // e.g., BetSlip._id, PaymentTransaction._id, AdminAction._id
    type: String, 
    index: true, 
  },
  description: {
    type: String,
    trim: true
  },
  balanceBefore: { // User's total wallet balance (from User model) before this transaction
    type: Number,
    required: true
  },
  balanceAfter: { // User's total wallet balance (from User model) after this transaction
    type: Number,
    required: true
  },
  metadata: { // For additional, type-specific details
    paymentMethod: { type: String, trim: true }, // e.g., 'credit_card_visa_1234', 'paypal'
    paymentGatewayId: { type: String, trim: true }, // Transaction ID from payment processor
    betSlipId: { type: mongoose.Schema.Types.ObjectId, ref: 'BetSlip' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For admin_credit/debit
    reason: { type: String, trim: true }, // For adjustments, refunds, etc.
  },
  transactionDate: { // Explicit transaction date
    type: Date,
    default: Date.now
  }
}, { 
  _id: true, // Each transaction will have its own ID
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Each user should have one wallet document
      index: true
    },

    history: [transactionSchema] // Array of transaction objects
  },
  { timestamps: true } 
);







const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
