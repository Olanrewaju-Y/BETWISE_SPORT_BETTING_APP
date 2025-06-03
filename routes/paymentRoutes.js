const express = require("express");
const router = express.Router();

// Import necessary controllers
const {
handleCreditWalletFromBank,
handlePaymentCallback,
 handleFlutterwaveBankTransferWebhook 
} = require("../controllers/paymentController");

// Import necessary middlewares
const {
  authenticateToken,
  validateRegister,
  validateEmailFormat
} = require("../middlewares/server");



// PAYMENTS

// credit-wallet-from-bank
router.post("/credit-wallet-from-bank", handleCreditWalletFromBank);

// payment-callback
router.get("/payment-callback", handlePaymentCallback);

// Webhook endpoint for Flutterwave to notify about bank transfer payments
router.post("/flutterwave-bank-webhook", handleFlutterwaveBankTransferWebhook);



module.exports = router; 