const express = require("express");
const router = express.Router();

const { handleAdminCreateEvent, handleDeleteAllUser, handleGetAllUsers,  handleGetAllEvents,
  handleDeleteAllEvents,
  handleGetEventById,
  handleUpdateGameResult } = require("../controllers/server");
const { authenticateToken, validateIsAdmin } = require("../middlewares/server");





// ADMIN POST GAMES 
router.post("/create-event", authenticateToken, validateIsAdmin, handleAdminCreateEvent);

// Get all registered gamblers
router.get("/all-users", authenticateToken, validateIsAdmin, handleGetAllUsers );

// delete all Users
router.delete("/delete-all-users", authenticateToken, validateIsAdmin, handleDeleteAllUser )

// Get all events
router.get("/all-events", handleGetAllEvents);

// delete all events
router.delete("/delete-all-events", authenticateToken, validateIsAdmin, handleDeleteAllEvents);

// Get an Event
router.get("/event/:id", handleGetEventById);

// Update Game Result
router.put("/update-game-result/:id", authenticateToken, validateIsAdmin, handleUpdateGameResult)




module.exports = router;