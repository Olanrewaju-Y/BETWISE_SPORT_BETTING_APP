const express = require("express");
const router = express.Router();

// Import necessary controllers
const {
  handleUserSignUp,
  handleUserLogin,
  handleForgetPassword,
  handleResetPassword,
  handleRefresh,
  handleLogOut
} = require("../controllers/authController");

// Import necessary middlewares
const {
  authenticateToken,
  validateRegister,
  validateEmailFormat
} = require("../middlewares/server");

const { BETWISE_PROJECT_CONTEXT } = require('../config/server');

// AUTH ROLES

// Sign - up API AND ENDPOINT
router.post("/signup", validateRegister, validateEmailFormat, handleUserSignUp);

// LOGIN API AND ENDPOINT
router.post("/login", validateRegister, validateEmailFormat, handleUserLogin);

// Login - RefreshToken
router.post("/refresh", validateRegister, validateEmailFormat, handleRefresh)

// LogOut
router.get("/logout", handleLogOut)

// FORGET PASSWORD
router.post("/forget-password", handleForgetPassword);

// Reset password
router.patch("/reset-password", authenticateToken, handleResetPassword);




module.exports = router; 