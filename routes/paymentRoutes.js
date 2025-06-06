const express = require("express");
const router = express.Router();

// Import necessary controllers
const {
handlePaymentHistory,
handleCreditWalletFromBank,
handlePaymentCallback,
 handleFlutterwaveBankTransferWebhook,
 handleCreditUserWallet
} = require("../controllers/paymentController");

// Import necessary middlewares
const {
  authenticateToken,
  validateRegister,
  validateEmailFormat,
  validateIsAdmin
} = require("../middlewares/server");



// PAYMENTS

// credit-wallet-from-bank
router.post("/credit-wallet-from-bank", authenticateToken, handleCreditWalletFromBank );

// payment-callback
router.get("/payment-callback", handlePaymentCallback );

// Webhook endpoint for Flutterwave to notify about bank transfer payments
router.post("/flutterwave-bank-webhook", handleFlutterwaveBankTransferWebhook );

// Credit user wallet - MANUALLY
router.post("/credit-user-wallet", authenticateToken, validateIsAdmin, handleCreditUserWallet )

// Wallet and Payment History
router.get("/wallet-and-payment-history", authenticateToken, handlePaymentHistory );













module.exports = router; 