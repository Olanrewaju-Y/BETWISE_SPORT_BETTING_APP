const express = require("express");
const router = express.Router();

const { 
  handleAdminCreateEvent, 
  handleDeleteAllUser, 
  handleGetAllUsers,
  handleDeleteAllEvents,
  handleUpdateGameOutcome, 
  
} = require("../controllers/server");

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

// Update Game Result
router.put("/update-game-result/:id", authenticateToken, validateIsAdmin, handleUpdateGameOutcome)







// Export the routers
module.exports = router;