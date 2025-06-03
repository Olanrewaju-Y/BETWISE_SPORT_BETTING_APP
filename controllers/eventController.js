const User = require("../models/userModel");
const dotenv = require("dotenv");
dotenv.config();
const Event = require("../models/eventModel");
const {
  settleBetSlipStatus,
} = require("../services/server");
const mongoose = require("mongoose");
const { MIN_BET_AMOUNT, MIN_TOPUP_AMOUNT } = require("../config/server");



// ADMIN ROLES

//  Create an Event - ONLY ADMIN CAN
const handleAdminCreateEvent = async (req, res) => {
  const {
    eventType,
    eventDescription,
    eventImage,
    homeTeam,
    awayTeam,
    availableOdds,
    eventStatus,
    eventReviews,
    eventDate,
    eventTime,
  } = req.body;
  const adminUser = req.user; // User object from authenticated token

  try {
    // --- Event Data Validation ---
    if (
      !eventType ||
      !homeTeam ||
      !awayTeam ||
      !eventDescription ||
      !eventDate ||
      !eventTime
    ) {
      res.status(400).json({
        message:
          "All core event fields are required: eventType, homeTeam, awayTeam, eventDescription, eventDate, eventTime.",
      });
      console.log("Admin create event failed: Missing required fields.");
      return;
    }

    // --- Create and Save New Event ---
    const newEvent = new Event({
      userId: adminUser._id, // CRITICAL: Set the userId from the authenticated admin
      // publicEventId: generatedPublicEventId, // Assign the generated public ID
      eventType,
      homeTeam,
      awayTeam,
      availableOdds,
      eventDescription,
      eventImage,
      eventStatus: eventStatus, // Let schema default handle it if not provided
      eventReviews: eventReviews, // Let schema default handle it if not provided
      eventDate,
      eventTime,
    });

    await newEvent.save();

    res.status(201).json({
      message: "Event created successfully by admin.",
      event: newEvent,
    });
    console.log("Event created successfully by admin:", adminUser.userName);
  } catch (error) {
    console.error("Error in /create-event:", error);
    res.status(500).json({
      message: "Server error while creating event.",
      error: error.message,
    });
  }
};

//  Get all Users
const handleGetAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find().select("-password").lean(); // Added .lean()
    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error in handleGetAllUsers:", error);
    res
      .status(500)
      .json({ message: "Error fetching users.", error: error.message });
  }
};

//  Delete all Users
const handleDeleteAllUser = async (req, res) => {
  try {
    const result = await User.deleteMany({}); // deleteMany({}) deletes all documents
    res.status(200).json({
      message: "All users deleted successfully.",
      deletedCount: result.deletedCount,
    });
    console.log(`All users deleted. Count: ${result.deletedCount}`);
  } catch (error) {
    console.error("Error in handleDeleteAllUser:", error);
    res
      .status(500)
      .json({ message: "Error deleting users.", error: error.message });
  }
};

//  Delete all Events
const handleDeleteAllEvents = async (req, res) => {
  try {
    const result = await Event.deleteMany({});
    res.status(200).json({
      message: "All events deleted successfully.",
      deletedCount: result.deletedCount,
    });
    console.log(`All events deleted. Count: ${result.deletedCount})`);
  } catch (error) {
    console.error("Error in handleDeleteAllEvents:", error);
    res
      .status(500)
      .json({ message: "Error deleting events.", error: error.message });
  }
};

// Update game Outcome
const handleUpdateGameOutcome = async (req, res) => {
  const eventId = req.params.id;
  const { homeTeamScore, awayTeamScore, eventStatus } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updateFields = {};

    if (homeTeamScore !== undefined) {
      if (typeof homeTeamScore !== "number" || homeTeamScore < 0) {
        throw new Error("homeTeamScore must be a non-negative number.");
      }
      updateFields.homeTeamScore = homeTeamScore;
    }

    if (awayTeamScore !== undefined) {
      if (typeof awayTeamScore !== "number" || awayTeamScore < 0) {
        throw new Error("awayTeamScore must be a non-negative number.");
      }
      updateFields.awayTeamScore = awayTeamScore;
    }

    if (eventStatus !== undefined) {
      const allowedEventStatuses = Event.schema.path("eventStatus").enumValues;
      if (!allowedEventStatuses.includes(eventStatus)) {
        throw new Error(
          `Invalid eventStatus. Must be one of: ${allowedEventStatuses.join(
            ", "
          )}`
        );
      }
      updateFields.eventStatus = eventStatus;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error("No valid fields provided for update.");
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $set: updateFields },
      { new: true, runValidators: true, session: session } // Run in session
    );

    if (!updatedEvent) {
      throw new Error("Event not found.");
    }

    // --- Bet Settlement Logic Trigger ---
    // Settle bets if the event status is updated to a final one AND scores are definitively set.
    const finalStatusesForSettlement = ["completed", "ended"]; // Define statuses that trigger settlement
    if (
      updateFields.eventStatus &&
      finalStatusesForSettlement.includes(updatedEvent.eventStatus)
    ) {
      const finalHomeScoreToSettle = updatedEvent.homeTeamScore;
      const finalAwayScoreToSettle = updatedEvent.awayTeamScore;

      if (
        typeof finalHomeScoreToSettle === "number" &&
        typeof finalAwayScoreToSettle === "number"
      ) {
        // Call the service function to settle bets, passing the session
        await settleBetSlipStatus(
          updatedEvent._id,
          finalHomeScoreToSettle,
          finalAwayScoreToSettle,
          session
        );
      } else {
        // This scenario (event completed but scores missing) might be an issue.
        // For now, we log a warning. Depending on business rules, this might need to abort the
        console.warn(
          `Event ${updatedEvent._id} marked as ${updatedEvent.eventStatus} but scores are missing/invalid. Bets not settled. This might require manual intervention or a different event status.`
        );
      }
    }

    await session.commitTransaction();

    res.status(200).json(updatedEvent);
    console.log(
      `Event ${updatedEvent._id} updated successfully. New status: ${updatedEvent.eventStatus}`
    );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Error in handleUpdateGameOutcome:", error);
    // Determine appropriate status code based on error type
    let statusCode = 500; // Default to internal server error
    if (error.message === "Event not found.") statusCode = 404;
    else if (error.name === "CastError" && error.path === "_id")
      statusCode = 400;
    else if (
      error.name === "ValidationError" ||
      error.message.startsWith("Invalid") ||
      error.message.startsWith("No valid fields") ||
      error.message.includes("must be a non-negative number")
    )
      statusCode = 400;

    res.status(statusCode).json({
      message: error.message,
      ...(error.errors && { errors: error.errors }),
    });
  } finally {
    await session.endSession();
  }
};

// Credit User Wallet
const handleCreditUserWallet = async (req, res) => {
  const { targetUserId, amount, description } = req.body; // Admin specifies whose wallet, how much, and why
  const adminUserId = req.user.id; // The admin performing the action

  if (!targetUserId || typeof amount !== "number" || amount <= 0) {
    return res
      .status(400)
      .json({ message: "Target User ID and a positive amount are required." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const targetUser = await User.findById(targetUserId).session(session); // Ensure user exists
    if (!targetUser) {
      await session.abortTransaction();
      // session.endSession(); // Rely on finally block
      return res.status(404).json({ message: "Target user not found." });
    }

    const { user: updatedUser, transactionLogEntry } =
      await updateUserWalletAndLogTransaction({
        session,
        userId: targetUserId,
        amountChange: amount, // Positive for credit
        transactionType: "admin_credit",
        description: description || `Manual credit by admin ${adminUserId}`,
        referenceId: null, // Or an admin action ID if you track those
        metadata: {
          adminUserId: adminUserId,
          reason: description || "Manual credit by administrator",
        },
      });

    await session.commitTransaction();
    res.status(200).json({
      message: `User ${updatedUser.userName}'s wallet credited successfully.`,
      newBalance: updatedUser.walletBalance,
      transaction: transactionLogEntry,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Error in handleCreditUserWallet:", error);
    res
      .status(500)
      .json({ message: "Error crediting user wallet.", error: error.message });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// Settle All User Wallet from Bet Slip Wins
const handleSettleAllUsersFromBetSlipWins = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Step 1: Incorporate settleBetSlipStatus logic.
    // Identify completed events that might have pending bet slips.
    const completedEvents = await Event.find({
      eventStatus: { $in: ["completed", "ended"] },
      homeTeamScore: { $exists: true, $ne: null }, // Ensure scores are definitively set
      awayTeamScore: { $exists: true, $ne: null },
    }).session(session);

    let eventsProcessedCount = 0;
    if (completedEvents.length > 0) {
      console.log(
        `Found ${completedEvents.length} completed events to check for bet settlement.`
      );
      for (const event of completedEvents) {
        // Call settleBetSlipStatus for each completed event.
        // This function handles finding pending betslips for this event,
        // determining win/loss, updating status to 'won'/'lost', and crediting users for 'won' slips.
        console.log(
          `Processing settlement for event: ${event._id} with scores ${event.homeTeamScore}-${event.awayTeamScore}`
        );
        await settleBetSlipStatus(
          event._id,
          event.homeTeamScore,
          event.awayTeamScore,
          session
        );
        eventsProcessedCount++;
      }
      console.log(
        `${eventsProcessedCount} events processed by settleBetSlipStatus.`
      );
    } else {
      console.log(
        "No completed events found requiring settlement processing via settleBetSlipStatus."
      );
    }

    // Step 2: "Conclude" by marking all "won" bet slips (potentially updated by step 1) as "settled".
    // settleBetSlipStatus should have already credited users for "won" slips.
    const wonBetSlips = await BetSlip.find({ betSlipStatus: "won" }).session(
      session
    );

    if (!wonBetSlips || wonBetSlips.length === 0) {
      await session.commitTransaction();
      // session.endSession(); // endSession will be called in finally
      return res.status(200).json({
        message:
          "No 'won' bet slips found to mark as 'settled'. Initial settlement processing complete.",
        eventsChecked: eventsProcessedCount,
      });
    }
    let settledCount = 0;
    for (const betSlip of wonBetSlips) {
      // The user should have already been credited by settleBetSlipStatus.
      // We are just changing the status from "won" to "settled".
      betSlip.betSlipStatus = "settled";
      await betSlip.save({ session });
      settledCount++;
      console.log(
        `Bet slip ${betSlip._id} (User: ${betSlip.userId}) marked as settled.`
      );
    }

    await session.commitTransaction();
    res.status(200).json({
      message: `Bet settlement process completed. ${eventsProcessedCount} events checked. ${settledCount} bet slips marked as 'settled'.`,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Error in handleSettleAllUsersFromBetSlipWins:", error);
    res.status(500).json({
      message: "Error during the bet settlement process.",
      error: error.message,
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};









module.exports = {
  handleAdminCreateEvent,
  handleGetAllUsers,
  handleDeleteAllUser,
  handleDeleteAllEvents,
  handleUpdateGameOutcome,
  handleCreditUserWallet,
  handleSettleAllUsersFromBetSlipWins
};
