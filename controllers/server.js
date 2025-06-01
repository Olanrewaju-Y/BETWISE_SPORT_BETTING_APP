const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config(); 
const Event = require("../models/eventModel");
const Odd = require("../models/oddModel");
const BetSlip = require("../models/betSlipModel");
const { sendForgetPasswordEmail, generateAccessToken, generateRefreshToken, extractNumericOddValue, settleBetSlipStatus } = require("../services/server");
const { checkWalletBalance } = require("../services/server");
const mongoose = require('mongoose'); // Import mongoose for transactions
const { MIN_BET_AMOUNT } = require('../config/server'); 



// AUTH ROLES

const handleUserSignUp = async (req, res) => {
      const {
      userName,
      password,
      age,
      walletBalance,
      nickName,
      role,
      gender,
      country,
      interests,
    } = req.body;
 
  try {

    if (age < 18 ) {
      res.status(400).json({
        message: "User must be 18 or above to register",
      });
      return console.log("User < 18 Error request was recieved");
    } 
    if( walletBalance !== 0 ){
      res.status(400).json({
        message: "wallet balance must be Zero upon Registration"
      })
     return console.log("wallet balance must be Zero upon Registration")
    }
    const existingUser = await User.findOne({ userName: userName });

    if (existingUser) {
      res.status(400).json({
        message: "UserName already exists, try login",
      });
      return console.log("UserName already exists error request was recieved");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userName,
      password: hashedPassword,
      age,
      walletBalance,
      nickName,
      role,
      gender,
      country,
      interests,
    });

    await newUser.save();

    res.status(200).json({
      message: "User created successfully",
      user: {
        userName: newUser.userName,
        age: newUser.age,
        walletBalance: newUser.walletBalance,
        nickName: newUser.nickName,
        role: newUser.role,
        gender: newUser.gender,
        country: newUser.country,
        interests: newUser.interests,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        }, 
    });
    console.log("User created successfully:", newUser.userName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
} 



const handleUserLogin = async (req, res) => {
    const { userName, password } = req.body
   try{
    const existingUser = await User.findOne({ userName })

    if (!existingUser) {
       res.status(400).json({
            message: "Incorrect username or password"
        })
        return console.log("Incorrect username or password request was recieved");
    }
// decoding the password
    const passwordMatch = await bcrypt.compare(password, existingUser?.password)
    if(!passwordMatch){
         res.status(400).json({
            message: "Incorrect password or username"
        })
        return console.log("Incorrect password or username request was recieved");
    }

    // Generate tokens using service functions
    const accessToken = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            userName: existingUser?.userName,
            age: existingUser?.age,
            walletBalance: existingUser?.walletBalance,
            nickName: existingUser?.nickName,
            role: existingUser?.role,
            gender: existingUser?.gender,
            country: existingUser?.country,
            interests: existingUser?.interests,
            userId: existingUser?._id,
            createdAt: existingUser?.createdAt,
            updatedAt: existingUser?.updatedAt,
        },
        accessToken,
        refreshToken // Send refresh token to the client if needed
    })
    console.log("User logged in successfully:", existingUser.userName);
   }
   catch(error){
    res.status(500).json({ message: error.message });
   }
}

const handleForgetPassword = async (req, res) => {
    const { userName } = req.body;

    try {
      const user = await User.findOne({ userName: userName });

      if(!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Generate access token for password reset
      const token = generateAccessToken(user);

      // Send the password reset email
      await sendForgetPasswordEmail(user, token);

      res.status(200).json({
        message: "Email sent successfully, pls check provided email",
      }) 
}
catch(error) {
    console.error("Error in handleForgetPassword:", error);
    res.status(500).json({ message: error.message });
}
}

const handleResetPassword = async (req, res) => {
  try{ 
    const { password } = req.body

    const user = await User.findById(req.user.id);

  if(!user) {
    return res.status(404).json({
      message: "User not found"
    })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  user.password = hashedPassword
  await user.save()

  res.status(200).json({
    message: "Password reset successfully"
  })
  console.log("Password reset successfully for user:", user.userName);
    }
    catch (error) {
    console.error("Error in handleResetPassword:", error);
    res.status(500).json({ message: error.message })
}
}
  

// ADMIN ROLES

//  Create an Event - ONLY ADMIN CAN
const handleAdminCreateEvent = async (req, res) => { 

  const { eventType, eventDescription, eventImage, homeTeam, awayTeam, availableOdds, eventStatus, eventReviews, eventDate, eventTime } = req.body;
  const adminUser = req.user; // User object from authenticated token

  try {
    // --- Event Data Validation ---
    if ( !eventType || !homeTeam || !awayTeam || !eventDescription || !eventDate || !eventTime) {
        res.status(400).json({
            message: "All core event fields are required: eventType, homeTeam, awayTeam, eventDescription, eventDate, eventTime."
        });
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
      eventTime
    });

    await newEvent.save();

    res.status(201).json({
      message: "Event created successfully by admin.",
      event: newEvent
    });
    console.log("Event created successfully by admin:", adminUser.userName);

  } catch (error) {
    console.error("Error in /create-event:", error);
    res.status(500).json({ message: "Server error while creating event.", error: error.message });
  }
}

//  Get all Users
const handleGetAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find().select("-password");
    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error in handleGetAllUsers:", error);
    res.status(500).json({ message: "Error fetching users.", error: error.message });
  }
}

//  Delete all Users
const handleDeleteAllUser = async (req, res) => {
  try {
    const result = await User.deleteMany({}); // deleteMany({}) deletes all documents
    res.status(200).json({ 
      message: "All users deleted successfully.",
      deletedCount: result.deletedCount 
    });
    console.log(`All users deleted. Count: ${result.deletedCount}`);
  } catch (error) {
    console.error("Error in handleDeleteAllUser:", error);
    res.status(500).json({ message: "Error deleting users.", error: error.message });
  }
}

//  Delete all Events
const handleDeleteAllEvents = async (req, res) => {
  try {
    const result = await Event.deleteMany({});
    res.status(200).json({
      message: "All events deleted successfully.",
      deletedCount: result.deletedCount
    });
    console.log(`All events deleted. Count: ${result.deletedCount})`);
  } catch (error) {
    console.error("Error in handleDeleteAllEvents:", error);
    res.status(500).json({ message: "Error deleting events.", error: error.message });
  }
}

// Update game Outcome
const handleUpdateGameOutcome = async (req, res) => {
  const eventId = req.params.id;
  const { homeTeamScore, awayTeamScore, eventStatus } = req.body;

const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updateFields = {};

    if (homeTeamScore !== undefined) {
      if (typeof homeTeamScore !== 'number' || homeTeamScore < 0) {
      throw new Error("homeTeamScore must be a non-negative number.");
      }
      updateFields.homeTeamScore = homeTeamScore;
    }

    if (awayTeamScore !== undefined) {
      if (typeof awayTeamScore !== 'number' || awayTeamScore < 0) {
      throw new Error("awayTeamScore must be a non-negative number.");
     
      }
      updateFields.awayTeamScore = awayTeamScore;
    }

    if (eventStatus !== undefined) {
      const allowedEventStatuses = Event.schema.path('eventStatus').enumValues;
      if (!allowedEventStatuses.includes(eventStatus)) {
          throw new Error(`Invalid eventStatus. Must be one of: ${allowedEventStatuses.join(', ')}`);
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
    if (updateFields.eventStatus && finalStatusesForSettlement.includes(updatedEvent.eventStatus)) {
        const finalHomeScoreToSettle = updatedEvent.homeTeamScore;
        const finalAwayScoreToSettle = updatedEvent.awayTeamScore;

        if (typeof finalHomeScoreToSettle === 'number' && typeof finalAwayScoreToSettle === 'number') {
            // Call the service function to settle bets, passing the session
            await settleBetSlipStatus(updatedEvent._id, finalHomeScoreToSettle, finalAwayScoreToSettle, session);
        } else {
            // This scenario (event completed but scores missing) might be an issue.
            // For now, we log a warning. Depending on business rules, this might need to abort the transaction.
            console.warn(`Event ${updatedEvent._id} marked as ${updatedEvent.eventStatus} but scores are missing/invalid. Bets not settled. This might require manual intervention or a different event status.`);
        }
    }

    await session.commitTransaction();

    res.status(200).json(updatedEvent);
    console.log(`Event ${updatedEvent._id} updated successfully. New status: ${updatedEvent.eventStatus}`);

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Error in handleUpdateGameOutcome:", error);
    // Determine appropriate status code based on error type
    let statusCode = 500; // Default to internal server error
    if (error.message === "Event not found.") statusCode = 404;
    else if (error.name === 'CastError' && error.path === '_id') statusCode = 400;
    else if (error.name === 'ValidationError' || error.message.startsWith("Invalid") || error.message.startsWith("No valid fields") || error.message.includes("must be a non-negative number")) statusCode = 400;
    
    res.status(statusCode).json({ message: error.message, ...(error.errors && { errors: error.errors }) });
  } finally {
    await session.endSession();
  }
};




// USERS ROLE
// Get all Events
const handleGetAllEvents = async (req, res) => {
  try {
    const allEvents = await Event.find();
    res.status(200).json(allEvents);
    } catch (error) {
    console.error("Error in handleGetAllEvents:", error);
    res.status(500).json({ message: "Error fetching events.", error: error.message });
}
}

// handleGetEventById
const handleGetEventById = async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error("Error in handleGetEventById:", error);
    res.status(500).json({ message: "Error fetching event.", error: error.message });
  }
}

// Place Odd
const handlePlaceOdd = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;
  const { selectedOdd } = req.body 
 
  try {
    // 1. Find the event and check its status
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if the event is open for betting
    const allowedBettingStatuses = ["upcoming", "ongoing"]; // Define statuses where betting is allowed
    if (!allowedBettingStatuses.includes(event.eventStatus)) {
        return res.status(400).json({ message: `Cannot place Odd on event with status: ${event.eventStatus}` });
    }

    // 2. Get Odds available for the event
    if (!selectedOdd) {
         return res.status(400).json({ message: `Selected Odd not available for this event.` });
    }

    // 3. Find the user
    const user = await User.findById(userId)

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    // 4. Calculate and validate the numeric value of the selected odd
    const calculatedOddValue = extractNumericOddValue(selectedOdd);
    if (calculatedOddValue === null || calculatedOddValue <= 0) {
        // No transaction to abort here as it hasn't started for this operation
        return res.status(400).json({ message: "Invalid selected odd. The calculated value is not a positive number or could not be determined." });
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
        eventDate: event.eventDate 
    });
    await newOdd.save(); 

    res.status(201).json({
        message: "Odd placed successfully, Refer to BetSummary to place Bet.",
        odd: newOdd 
    });
    console.log(`Odd placed by user ${user.userName} on event ${event._id}`);

  } catch (error) {
    console.error("Error in handlePlaceOdd:", error);
    res.status(500).json({ message: "Server error while placing Odd.", error: error.message });
  }
};

//  Delete All Place Odds (all Cart Items)
const handleDeleteAllPlacedOdds = async (req, res) => {
  try {
    const result = await Odd.deleteMany({});
    res.status(200).json({
      message: "All Odds deleted successfully.",
      deletedCount: result.deletedCount
    });
    console.log(`All Odds deleted. Count: ${result.deletedCount})`);
  } catch (error) {
    console.error("Error in handleDeleteAllPlacedOdds:", error);
    res.status(500).json({ message: "Error deleting Odds.", error: error.message });
  }
}

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
      session.endSession();
      return res.status(400).json({ message: "oddIds must be a non-empty array." });
    }
      if (typeof betAmount !== 'number' || betAmount < MIN_BET_AMOUNT) {
     
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Invalid bet amount. Minimum bet is ${MIN_BET_AMOUNT}.` });
    }

    // 2. Fetch Odd documents and validate them
    const selectedOddsDocs = await Odd.find({ 
      _id: { $in: oddIds }, 
      userId: userId, // Ensure odds belong to the user
      eventOddStatus: { $in: ["upcoming", "ongoing"] } // Ensure odds are bettable
    }).session(session);

    if (selectedOddsDocs.length !== oddIds.length) {
      console.log(selectedOddsDocs);
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "One or more selected odds are invalid, do not belong to the user, or are not in a bettable state." });
    }

    // 3. Calculate total accumulated odds
    let accumulatedOdds = 1;
    
    for (const oddDoc of selectedOddsDocs) {

     const numericOddValue = oddDoc.totalSelectedOddsValue; // Using the pre-calculated value
   console.log(`DEBUG: For Odd ${oddDoc._id}, using stored totalSelectedOddsValue: ${numericOddValue}`);
     
  
  if (numericOddValue && numericOddValue > 0) {
        accumulatedOdds *= numericOddValue;

      } else {
        await session.abortTransaction();
        session.endSession();
        console.warn(`Invalid or missing numeric odd value in Odd document ${oddDoc._id}:`, oddDoc.selectedOdd);
            return res.status(400).json({ message: `Invalid odd value (${numericOddValue}) found in selection for event: ${oddDoc.homeTeam} vs ${oddDoc.awayTeam}. Stored totalSelectedOddsValue might be incorrect.` });
       }
    }

    if (accumulatedOdds <= 0) { // Or accumulatedOdds < 1 depending on rules for single bets at 1.0
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Accumulated odds must be greater than 0." });
    }

    // 4. Check user's wallet balance
    const balanceCheckResult = await checkWalletBalance(userId, betAmount, session); // Pass session if checkWalletBalance supports it
    if (!balanceCheckResult.sufficient) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: balanceCheckResult.message || "Insufficient wallet balance." });
    }

    // 5. Deduct betAmount from user's wallet
    const user = await User.findById(userId).session(session); // User should exist if balance check passed
    user.walletBalance -= betAmount;
    await user.save({ session });

    // 6. Calculate potential payout (Standard: stake * total odds)
    const potentialPayout = accumulatedOdds * betAmount;

    // 7. Create the BetSlip document
    const newBetSlip = new BetSlip({
      userId: userId,
      oddIds: selectedOddsDocs.map(doc => doc._id),
      totalOddsValue: parseFloat(accumulatedOdds.toFixed(2)),
      betAmount: betAmount,
      totalBets: selectedOddsDocs.length,
      potentialPayout: parseFloat(potentialPayout.toFixed(2)),
      betSlipStatus: "pending"
    });
    await newBetSlip.save({ session });

    // 8. Update status of the Odd documents to "processed"
    const processedOddIds = selectedOddsDocs.map(doc => doc._id);
    await Odd.updateMany({ _id: { $in: processedOddIds } }, { $set: { eventOddStatus: "processed" } }).session(session);

    // 9. Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Bet slip created successfully!",
      betSlip: newBetSlip
    });
    console.log(`Bet slip ${newBetSlip._id} created for user ${userId} with specific odds.`);

  } catch (error) {
    if (session.inTransaction()) {
        await session.abortTransaction(); // Abort transaction on error
    }
    console.error("Error in handleCreateBetSlip:", error);
    res.status(500).json({ message: "Error creating bet slip.", error: error.message });
  } finally {
    if (session && session.inTransaction()) { // Ensure session exists and is active before trying to end it
        // If commitTransaction() was successful, session is already ended.
        // If abortTransaction() was called, session is already ended.
        // This handles cases where an error occurs before commit/abort.
        // However, Mongoose's session.endSession() is idempotent, so calling it again is safe.
    }
    if (session) { // Always try to end the session if it was started
        await session.endSession();
      }
    }
};

// Get all Bet Slips And Outcomes
const handleGetAllBetSlips = async (req, res) => {
   const userId = req.user.id; 
  try {
    // Find all bet slips where the userId field matches the authenticated user's ID
    const userBetSlips = await BetSlip.find({ userId: userId }).populate('oddIds');

    if(!userBetSlips) {
      return res.status(400).json({
        message: "Invalid. user BetSlip not found"
      })
    }

    res.status(200).json(userBetSlips);
  } catch (error) {
    console.error("Error in handleGetAllBetSlips:", error);
    res.status(500).json({ message: "Error fetching bet slips.", error: error.message });
  }
}

// Delete All User Bet Slips
const handleDeleteUserBetSlips = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await BetSlip.deleteMany({ userId: userId });
    res.status(200).json({
      message: "All bet slips deleted successfully.",
      deletedCount: result.deletedCount
    });
    console.log(`All bet slips for user ${userId} deleted. Count: ${result.deletedCount})`);
} catch (error) {
    console.error("Error in handleDeleteUserBetSlips:", error);
    res.status(500).json({ message: "Error deleting bet slips.", error: error.message });
}
}







module.exports = {
  handleUserSignUp,
  handleUserLogin,
  handleForgetPassword,
  handleResetPassword,
  handleAdminCreateEvent,
  handleGetAllUsers,
  handleDeleteAllUser,
  handleGetAllEvents,
  handleDeleteAllEvents,
  handleGetEventById,
  handleUpdateGameOutcome, 
  handlePlaceOdd,
  handleDeleteAllPlacedOdds,
  handleCreateBetSlip,
  handleGetAllBetSlips,
  handleDeleteUserBetSlips
  
};
