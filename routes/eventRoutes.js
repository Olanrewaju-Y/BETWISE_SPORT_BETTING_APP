const express = require("express");
const router = express.Router();

const { 
  handleAdminCreateEvent, 
  handleDeleteAllUser, 
  handleGetAllUsers,
  handleDeleteAllEvents,
  handleUpdateGameOutcome,
  handleCreditUserWallet,
  handleSettleAllUsersFromBetSlipWins, 
  
} = require("../controllers/eventController");

const { authenticateToken, validateIsAdmin } = require("../middlewares/server");


// ADMIN ROLES 


// Admin post games/events 
router.post("/create-event", authenticateToken, validateIsAdmin, handleAdminCreateEvent);

// Get all registered gamblers
router.get("/all-users", authenticateToken, validateIsAdmin, handleGetAllUsers );

// delete all Users
router.delete("/delete-all-users", authenticateToken, validateIsAdmin, handleDeleteAllUser )

// delete all events
router.delete("/delete-all-events", authenticateToken, validateIsAdmin, handleDeleteAllEvents);

// Update Game Outcome
router.put("/update-game-outcome/:id", authenticateToken, validateIsAdmin, handleUpdateGameOutcome)

// Credit user wallet -MANUALLY
router.post("/credit-user-wallet", authenticateToken, validateIsAdmin, handleCreditUserWallet )

// Settle All Users From Bet Slip Wins
router.post("/settle-all-users-from-bet-slip-wins", authenticateToken, validateIsAdmin, handleSettleAllUsersFromBetSlipWins )











// Export the routers
module.exports = router;