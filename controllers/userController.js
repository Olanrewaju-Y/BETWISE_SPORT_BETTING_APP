const User = require("../models/userModel");
const dotenv = require("dotenv");
dotenv.config();
const Event = require("../models/eventModel");
const Odd = require("../models/oddModel");
const BetSlip = require("../models/betSlipModel");
const Wallet = require("../models/walletModel");
const {
  extractNumericOddValue,
  settleBetSlipStatus,
  checkWalletBalance,
  updateUserWalletAndLogTransaction,
} = require("../services/server");
const mongoose = require("mongoose");
const { MIN_BET_AMOUNT } = require("../config/server");






// USERS ROLE
// Get all Events
const handleGetAllEvents = async (req, res) => {
  try {
    const allEvents = await Event.find().lean(); // Added .lean()
    res.status(200).json(allEvents);
  } catch (error) {
    console.error("Error in handleGetAllEvents:", error);
    res
      .status(500)
      .json({ message: "Error fetching events.", error: error.message });
  }
};

// handleGetEventById
const handleGetEventById = async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await Event.findById(eventId).lean(); // Added .lean()
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error("Error in handleGetEventById:", error);
    res
      .status(500)
      .json({ message: "Error fetching event.", error: error.message });
  }
};

// Place Odd
const handlePlaceOdd = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;
  const { selectedOdd } = req.body;

  try {
    // 1. Find the event and check its status
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if the event is open for betting
    const allowedBettingStatuses = ["upcoming", "ongoing"]; // Define statuses where betting is allowed
    if (!allowedBettingStatuses.includes(event.eventStatus)) {
      return res.status(400).json({
        message: `Cannot place Odd on event with status: ${event.eventStatus}`,
      });
    }

    // 2. Get Odds available for the event
    if (!selectedOdd) {
      return res
        .status(400)
        .json({ message: `Selected Odd not available for this event.` });
    }

    // 3. Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 4. Calculate and validate the numeric value of the selected odd
    const calculatedOddValue = extractNumericOddValue(selectedOdd);
    if (calculatedOddValue === null || calculatedOddValue <= 0) {
      // No transaction to abort here as it hasn't started for this operation
      return res.status(400).json({
        message:
          "Invalid selected odd. The calculated value is not a positive number or could not be determined.",
      });
    }

    // 5. Create the Odd
    const newOdd = new Odd({
      userId: user._id,
      eventId: event._id,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      selectedOdd: selectedOdd,
      totalSelectedOddsValue: calculatedOddValue, // Use the validated calculated value
      eventType: event.eventType,
      eventDate: event.eventDate,
    });
    await newOdd.save();

    res.status(201).json({
      message: "Odd placed successfully, Refer to BetSummary to place Bet.",
      odd: newOdd,
    });
    console.log(`Odd placed by user ${user.email} on event ${event._id}`);
  } catch (error) {
    console.error("Error in handlePlaceOdd:", error);
    res.status(500).json({
      message: "Server error while placing Odd.",
      error: error.message,
    });
  }
};

// Get all Placed Odds
const handleAllPlacedOdds = async (req, res) => {
  const userId = req.user.id; // Assuming this should be user-specific
  try {
    // If this is meant to be admin-only to see ALL odds, it should be on an admin route.
    // Assuming it's for a user to see their currently selected (but not betted) odds.
    const allOdds = await Odd.find({ userId: userId, eventOddStatus: { $in: ["upcoming", "ongoing"] } }).lean();
    res.status(200).json(allOdds);
  } catch (error) {
    console.error("Error in handleAllPlacedOdds:", error);
    res
      .status(500)
      .json({ message: "Error fetching Odds.", error: error.message });
  }
};

//  Delete one placed odd
const handleDeleteOnePlacedOdd = async (req, res) => {
   const userId = req.user.id;
   try{const { id: oddId } = req.params; // Assuming oddId comes from URL params as 'id'
   const result = await Odd.deleteOne({ _id: oddId, userId: userId });

    // Check if an odd was actually deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Odd not found or you do not have permission to delete it.' });
    }

    // If deletedCount is 1, the odd was successfully deleted
    return res.status(200).json({ message: 'Odd successfully deleted.' });

  } catch (error) {
    console.error('Error deleting odd:', error); // Log the error for debugging
    return res.status(500).json({ message: 'An error occurred while deleting the odd.', error: error.message });
  }
}

//  Delete All Place Odds (all Cart Items)
const handleDeleteAllPlacedOdds = async (req, res) => {
  const userId = req.user.id;
  try {
    // This should delete only the authenticated user's un-processed odds.
    const result = await Odd.deleteMany({
      userId: userId,
      eventOddStatus: { $in: ["upcoming", "ongoing"] } // Only delete odds not yet part of a bet slip
    });
    res.status(200).json({
      message: "Your selected odds (not yet betted) have been cleared successfully.",
      deletedCount: result.deletedCount,
    });
    console.log(`User ${userId} cleared their selected odds. Count: ${result.deletedCount}`);
  } catch (error) {
    console.error("Error in handleDeleteAllPlacedOdds:", error);
    res
      .status(500)
      .json({ message: "Error deleting Odds.", error: error.message });
  }
};

// Create Bet Slip with specific Odd Ids
const handleCreateBetSlip = async (req, res) => {
  const userId = req.user.id;
  const { oddIds, betAmount } = req.body;
  console.log("Attempting to create bet slip for userId:", userId);
  console.log("Received oddIds:", oddIds);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate input
    if (!Array.isArray(oddIds) || oddIds.length === 0) {
      await session.abortTransaction();
      // session.endSession(); // Rely on finally block
      return res
        .status(400)
        .json({ message: "oddIds must be a non-empty array." });
    }
    if (typeof betAmount !== "number" || betAmount < MIN_BET_AMOUNT) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Invalid bet amount. Minimum bet is ${MIN_BET_AMOUNT}.`,
      });
    }

    // 2. Fetch Odd documents and validate them
    const selectedOddsDocs = await Odd.find({
      _id: { $in: oddIds },
      userId: userId, // Ensure odds belong to the user
      eventOddStatus: { $in: ["upcoming", "ongoing"] }, // Ensure odds are bettable
    }).session(session);

    if (selectedOddsDocs.length !== oddIds.length) {
      console.log(selectedOddsDocs);
      await session.abortTransaction();
      // session.endSession();
      return res.status(400).json({
        message:
          "One or more selected odds are invalid, do not belong to the user, or are not in a bettable state.",
      });
    }

    // 3. Calculate total accumulated odds
    let accumulatedOdds = 1;

    for (const oddDoc of selectedOddsDocs) {
      const numericOddValue = oddDoc.totalSelectedOddsValue; // Using the pre-calculated value
      console.log(
        `DEBUG: For Odd ${oddDoc._id}, using stored totalSelectedOddsValue: ${numericOddValue}`
      );

      if (numericOddValue && numericOddValue > 0) {
        accumulatedOdds *= numericOddValue;
      } else {
        await session.abortTransaction();
        // session.endSession();
        console.warn(
          `Invalid or missing numeric odd value in Odd document ${oddDoc._id}:`,
          oddDoc.selectedOdd
        );
        return res.status(400).json({
          message: `Invalid odd value (${numericOddValue}) found in selection for event: ${oddDoc.homeTeam} vs ${oddDoc.awayTeam}. Stored totalSelectedOddsValue might be incorrect.`,
        });
      }
    }

    if (accumulatedOdds <= 0) {
      // Or accumulatedOdds < 1 depending on rules for single bets at 1.0
      await session.abortTransaction();
      // session.endSession();
      return res
        .status(400)
        .json({ message: "Accumulated odds must be greater than 0." });
    }

    // 4. Check user's wallet balance
    const balanceCheckResult = await checkWalletBalance(
      userId,
      betAmount,
      session
    ); // Pass session if checkWalletBalance supports it
    if (!balanceCheckResult.sufficient) {
      await session.abortTransaction();
      // session.endSession(); // Rely on finally block
      return res.status(400).json({
        message: balanceCheckResult.message || "Insufficient wallet balance.",
      });
    }

    // 6. Calculate potential payout (Standard: stake * total odds)
    const potentialPayout = accumulatedOdds * betAmount;

    // 7. Create the BetSlip document
    const newBetSlip = new BetSlip({
      userId: userId,
      oddIds: selectedOddsDocs.map((doc) => doc._id),
      totalOddsValue: parseFloat(accumulatedOdds.toFixed(2)),
      betAmount: betAmount,
      numberOfSelections: selectedOddsDocs.length, // This is the number of selections/odds
      potentialPayout: parseFloat(potentialPayout.toFixed(2)),
      betSlipStatus: "pending",
    });
    // newBetSlip._id is available here even before saving.

    // 5. Deduct betAmount from user's wallet AND Log Transaction
    const { transactionLogEntry: betPlacementLog } =
      await updateUserWalletAndLogTransaction({
        session,
        userId: userId,
        amountChange: -betAmount, // Negative for debit
        transactionType: "bet_placement",
        description: `Bet placed with slip ID: ${newBetSlip._id}`,
        referenceId: newBetSlip._id.toString(),
        metadata: {
          betSlipId: newBetSlip._id, // Store the actual ObjectId
          stake: betAmount,
          potentialPayout: newBetSlip.potentialPayout,
          numberOfSelections: newBetSlip.numberOfSelections,
        },
      });
    await newBetSlip.save({ session }); // Now save the bet slip

    // 8. Update status of the Odd documents to "processed"
    const processedOddIds = selectedOddsDocs.map((doc) => doc._id);
    await Odd.updateMany(
      { _id: { $in: processedOddIds } },
      { $set: { eventOddStatus: "processed" } }
    ).session(session);

    // 9. Commit the transaction
    await session.commitTransaction();

    res.status(201).json({
      message: "Bet slip created successfully!",
      betSlip: newBetSlip,
      transaction: betPlacementLog,
    });
    console.log(
      `Bet slip ${newBetSlip._id} created for user ${userId}. Transaction: ${betPlacementLog._id}`
    );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction(); // Abort transaction on error
    }
    console.error("Error in handleCreateBetSlip:", error);
    let errorMessage = "Error creating bet slip.";
    if (
      error.message.includes("Insufficient funds") ||
      error.message.includes("negative balance")
    ) {
      errorMessage = error.message; // Provide more specific feedback
    }
    res.status(500).json({ message: errorMessage, error: error.message });
  } finally {
    if (session && session.inTransaction()) {
      // Ensure session exists and is active before trying to end it
      // If commitTransaction() was successful, session is already ended.
      // If abortTransaction() was called, session is already ended.
      // This handles cases where an error occurs before commit/abort.
      // Mongoose's session.endSession() is idempotent.
    }
    if (session) {
      await session.endSession(); // Always end the session if it was started
    }
  }
};

// Get all Bet Slips And Outcomes
const handleGetAllBetSlips = async (req, res) => {
  const userId = req.user.id;
  try {
    // Find all bet slips where the userId field matches the authenticated user's ID
    const userBetSlips = await BetSlip.find({ userId: userId }).populate(
      "oddIds"
    );

    if (!userBetSlips || userBetSlips.length === 0) {
      return res.status(400).json({
        message: "No bet slips found for this user.",
      });
    }

    res.status(200).json(userBetSlips);
  } catch (error) {
    console.error("Error in handleGetAllBetSlips:", error);
    res
      .status(500)
      .json({ message: "Error fetching bet slips.", error: error.message });
  }
};

// Delete All User Bet Slips
const handleDeleteUserBetSlips = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await BetSlip.deleteMany({ userId: userId });
    res.status(200).json({
      message: "All bet slips deleted successfully.",
      deletedCount: result.deletedCount,
    });
    console.log(
      `All bet slips for user ${userId} deleted. Count: ${result.deletedCount})`
    );
  } catch (error) {
    console.error("Error in handleDeleteUserBetSlips:", error);
    res
      .status(500)
      .json({ message: "Error deleting bet slips.", error: error.message });
  }
};








module.exports = {
  handleGetAllEvents,
  handleGetEventById,
  handlePlaceOdd,
  handleAllPlacedOdds,
  handleDeleteOnePlacedOdd,
  handleDeleteAllPlacedOdds,
  handleCreateBetSlip,
  handleGetAllBetSlips,
  handleDeleteUserBetSlips
};
