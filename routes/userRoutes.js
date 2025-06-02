const express = require("express");
const router = express.Router();

const { 
  handleGetAllEvents,
  handleGetEventById, 
  handlePlaceOdd,
  handleCreateBetSlip,
  handleDeleteAllPlacedOdds,
  handleGetAllBetSlips,
  handleDeleteUserBetSlips,
  handleGetUserWalletTransactions,
  handleAllPlacedOdds
} = require("../controllers/server");

const { authenticateToken, validateIsAdmin } = require("../middlewares/server");



// USER ROLES

// Get all Event
router.get("/all-events", authenticateToken, handleGetAllEvents )

// Get just one Event
router.get("/event/:id", handleGetEventById);

// Place Odds
router.patch("/place-odd/:id", authenticateToken, handlePlaceOdd )

// Gell all placed Odds
router.get("/all-placed-odds", authenticateToken, handleAllPlacedOdds )

// Delete Placed Odds
router.delete("/delete-all-placed-Odds", authenticateToken, handleDeleteAllPlacedOdds )

// Create a Bet Slip with specific Odds
router.post("/create-bet-slip", authenticateToken, handleCreateBetSlip);

// Get all Bet Slips
router.get("/user-bet-slips", authenticateToken, handleGetAllBetSlips )

// Delete All User BetSlips
router.delete("/delete-user-bet-slips", authenticateToken, handleDeleteUserBetSlips )

// Get User Wallet Transactions
router.get("/user-wallet-transactions", authenticateToken, handleGetUserWalletTransactions )







module.exports = router






module.exports = router