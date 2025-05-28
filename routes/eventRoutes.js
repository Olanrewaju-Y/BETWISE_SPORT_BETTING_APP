const express = require("express");
const router = express.Router();

const { 
  handleAdminCreateEvent, 
  handleDeleteAllUser, 
  handleGetAllUsers,  
  handleGetAllEvents,
  handleDeleteAllEvents,
  handleGetEventById,
  handleUpdateGameOutcome, 
  handlePlaceOdd,
  handleGetPlacedOddsAndBet
} = require("../controllers/server");

const { authenticateToken, validateIsAdmin } = require("../middlewares/server");


// ADMIN ROLES 


// Admin post games/events 
router.post("/create-event", authenticateToken, validateIsAdmin, handleAdminCreateEvent);

// Get all registered gamblers
router.get("/all-users", authenticateToken, validateIsAdmin, handleGetAllUsers );

// delete all Users
router.delete("/delete-all-users", authenticateToken, validateIsAdmin, handleDeleteAllUser )

// Get all events
router.get("/all-events", handleGetAllEvents);

// delete all events
router.delete("/delete-all-events", authenticateToken, validateIsAdmin, handleDeleteAllEvents);

// Update Game Result
router.put("/update-game-result/:id", authenticateToken, validateIsAdmin, handleUpdateGameOutcome)



// USER ROLES

// Get all Event
router.get("/all-events", authenticateToken, handleGetAllEvents )

// Get just one Event
router.get("/event/:id", handleGetEventById);

// Place Odds
router.put("/place-Odd/:id", authenticateToken, handlePlaceOdd )

// Book A Bet
router.post("/book-a-bet", authenticateToken, handleGetPlacedOddsAndBet )





// Export the routers
module.exports = router;