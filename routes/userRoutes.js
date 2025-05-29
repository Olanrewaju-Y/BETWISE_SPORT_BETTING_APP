const express = require("express");
const router = express.Router();

const { 
  handleGetAllEvents,
  handleGetEventById, 
  handlePlaceOdd,
  handleGetPlacedOddsAndBet
} = require("../controllers/server");

const { authenticateToken, validateIsAdmin } = require("../middlewares/server");



// USER ROLES

// Get all Event
router.get("/all-events", authenticateToken, handleGetAllEvents )

// Get just one Event
router.get("/event/:id", handleGetEventById);

// Place Odds
router.put("/place-Odd/:id", authenticateToken, handlePlaceOdd )

// Book A Bet
router.post("/book-a-bet", authenticateToken, handleGetPlacedOddsAndBet )







module.exports = router