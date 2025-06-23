const express = require("express");
const router = express.Router();

const { 
  handleGetAllEvents,
  handleGetEventById, 
  handlePlaceOdd,
  handleCreateBetSlip,
  handleDeleteOnePlacedOdd,
  handleDeleteAllPlacedOdds,
  handleGetAllBetSlips,
  handleDeleteUserBetSlips,
  handleAllPlacedOdds
} = require("../controllers/userController");

const { authenticateToken, validateIsAdmin } = require("../middlewares/server");



// USER ROLES

// Get all Event
router.get("/all-events", handleGetAllEvents )

// Get just one Event
router.get("/event/:id", handleGetEventById);

// Place Odds
router.patch("/place-odd/:id", authenticateToken, handlePlaceOdd )

// Gell all placed Odds
router.get("/all-placed-odds", authenticateToken, handleAllPlacedOdds )

// Delete one placed odd
router.delete("/delete-one-placed-Odd", authenticateToken, handleDeleteOnePlacedOdd )

// Delete Placed Odds
router.delete("/delete-all-placed-Odds", authenticateToken, handleDeleteAllPlacedOdds )

// Create a Bet Slip with specific Odds
router.post("/create-bet-slip", authenticateToken, handleCreateBetSlip);

// Get all Bet Slips
router.get("/user-bet-slips", authenticateToken, handleGetAllBetSlips )

// Delete All User BetSlips
router.delete("/delete-user-bet-slips", authenticateToken, handleDeleteUserBetSlips )









module.exports = router