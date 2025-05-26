const express = require("express");
const router = express.Router();

// Import necessary controllers
const {
  handleUserSignUp,
  handleUserLogin,
  handleForgetPassword,
  handleResetPassword
} = require("../controllers/server");

// Import necessary middlewares
const {
  authenticateToken,
  validateRegister,
  validateEmailFormat
} = require("../middlewares/server");



// Sign - up API AND ENDPOINT
router.post("/signup", validateRegister, validateEmailFormat, handleUserSignUp);

// LOGIN API AND ENDPOINT
router.post("/login", validateRegister, validateEmailFormat, handleUserLogin);

// FORGET PASSWORD
router.post("/forget-password", handleForgetPassword);

// Reset password
router.patch("/reset-password", authenticateToken, handleResetPassword);




module.exports = router; 