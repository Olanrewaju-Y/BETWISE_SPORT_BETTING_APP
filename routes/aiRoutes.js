const express = require("express");
const handleAiVirtualAssistant = require("../virtual-assistant/aiController");
const router = express.Router();

// Import necessary controllers
const {
  authenticateToken
} = require("../middlewares/server");




// AI Virtual assistant

// Virtual assistant API AND ENDPOINT
router.post("/assistant", authenticateToken, handleAiVirtualAssistant);






module.exports = router; 