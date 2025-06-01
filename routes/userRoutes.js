const express = require("express");
const router = express.Router();

const { 
  handleGetAllEvents,
  handleGetEventById, 
  handlePlaceOdd,
  handleCreateBetSlip,
  handleDeleteAllPlacedOdds,
  handleGetAllBetSlips
} = require("../controllers/server");

const { authenticateToken, validateIsAdmin } = require("../middlewares/server");



// USER ROLES

// Get all Event
router.get("/all-events", authenticateToken, handleGetAllEvents )

// Get just one Event
router.get("/event/:id", handleGetEventById);

// Place Odds
router.patch("/place-odd/:id", authenticateToken, handlePlaceOdd )

// Delete Placed Odds
router.delete("/delete-all-placed-Odds", authenticateToken, handleDeleteAllPlacedOdds )

// Create a Bet Slip with specific Odds
router.post("/create-bet-slip", authenticateToken, handleCreateBetSlip);

// Get all Bet Slips
router.post("/all-bet-slips", authenticateToken, handleGetAllBetSlips )






module.exports = router