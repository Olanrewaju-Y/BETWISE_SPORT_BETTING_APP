const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config(); 
const Event = require("../models/eventModel");
const Odd = require("../models/oddModel");
const BetSlip = require("../models/betSlipModel");
const { sendForgetPasswordEmail, generateAccessToken, generateRefreshToken } = require("../services/server");
const { checkWalletBalance } = require("../services/server");
const mongoose = require('mongoose'); // Import mongoose for transactions


// AUTH ROLES

const handleUserSignUp = async (req, res) => {
      const {
      userName,
      password,
      below18,
      walletBalance,
      nickName,
      role,
      gender,
      country,
      interests,
    } = req.body;
 
  try {

    if (below18 < 18 ) {
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
    
    const existingUser = await User.findOne({ userName });

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
      below18,
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
        below18: newUser.below18,
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
    const { userName, password } = req.body;

   try{
  // First stage validation on inputs

    // second stage validation with database
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
            below18: existingUser?.below18,
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

  const { eventType, eventDescription, eventImage, homeTeam, homeTeamPoint, drawPoint, awayTeamPoint, awayTeam, availableOdds, eventStatus, eventReviews, eventDate, eventTime } = req.body;
  const adminUser = req.user; // User object from authenticated token

  try {
    // --- Event Data Validation ---
    if ( !homeTeamPoint || !drawPoint || !awayTeamPoint || !eventType || !homeTeam || !awayTeam || !eventDescription || !eventDate || !eventTime) {
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
      homeTeamPoint, drawPoint, awayTeamPoint,
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
  const { homeTeamPoint, drawPoint, awayTeamPoint, homeTeamScore, awayTeamScore, eventStatus } = req.body;

  try {
    const updateFields = {};

    if (homeTeamScore !== undefined) {
      if (typeof homeTeamScore !== 'number' || homeTeamScore < 0) {
        return res.status(400).json({ message: "homeTeamScore must be a non-negative number." });
      }
      updateFields.homeTeamScore = homeTeamScore;
    }

    if (homeTeamPoint !== undefined) {
      if (typeof homeTeamPoint !== 'number' || homeTeamPoint < 0) {
        return res.status(400).json({ message: "homeTeamPoint must be a non-negative number." });
      }
      updateFields.homeTeamPoint = homeTeamPoint;
    }

    if (drawPoint !== undefined) {
      if (typeof drawPoint !== 'number' || drawPoint < 0) {
        return res.status(400).json({ message: "drawPoint must be a non-negative number." });
      }
      updateFields.drawPoint = drawPoint;
    }

    if (awayTeamPoint !== undefined) {
      if (typeof awayTeamPoint !== 'number' || awayTeamPoint < 0) {
        return res.status(400).json({ message: "awayTeamPoint must be a non-negative number." });
      }
      updateFields.awayTeamPoint = awayTeamPoint;
    }

    if (awayTeamScore !== undefined) {
      if (typeof awayTeamScore !== 'number' || awayTeamScore < 0) {
        return res.status(400).json({ message: "awayTeamScore must be a non-negative number." });
      }
      updateFields.awayTeamScore = awayTeamScore;
    }

    if (eventStatus !== undefined) {
      const allowedEventStatuses = Event.schema.path('eventStatus').enumValues;
      if (!allowedEventStatuses.includes(eventStatus)) {
        return res.status(400).json({
            message: `Invalid eventStatus. Must be one of: ${allowedEventStatuses.join(', ')}`
        });
      }
      updateFields.eventStatus = eventStatus;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update." });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found." });
    }
    res.status(200).json(updatedEvent);
    console.log(`Event ${updatedEvent._id} updated successfully. New status: ${updatedEvent.eventStatus}`);
  } catch (error) {
    if (error.name === 'CastError' && error.path === '_id') {
        return res.status(400).json({ message: "Invalid event ID format." });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Validation failed.", errors: error.errors });
    }
    console.error("Error in handleUpdateGameResult:", error);
    res.status(500).json({ message: "Error updating event.", error: error.message });
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

    // 5. Create the Odd
    const newOdd = new Odd({
        userId: user._id,
        eventId: event._id,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        selectedOdd: selectedOdd, 
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

// Get all placed Odds and Place Bet 
const handleGetPlacedOddsAndBet = async (req, res) => {
  const userId = req.user.id
  const { betAmount } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
 
  try {
    // 1. Fetch all "upcoming", "ongoing" Odd documents for the user
    
      const selectedOddsDocs = await Odd.find({ 
      userId: userId,
      eventOddStatus: { $in: ["upcoming", "ongoing"] } // Filter by eventOddStatus
    }).session(session);
 
 
    if (!selectedOddsDocs || selectedOddsDocs.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No odds selected to place a bet." });
    }
 
    // 2. Validate betAmount
    if (typeof betAmount !== 'number' || betAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid bet amount." });
    }
 
    // 3. Check user's wallet balance using the utility function
    const balanceCheckResult = await checkWalletBalance(userId, betAmount);
    if (!balanceCheckResult.sufficient) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: balanceCheckResult.message || "Failed to verify wallet balance." });
    }
 
    // 4. Fetch user to update wallet (already implicitly checked by checkWalletBalance if user exists)
    const user = await User.findById(userId).session(session);
    if (!user) { // Should ideally not happen if checkWalletBalance passed and user exists
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found." });
    }
 
    // 5. Calculate total accumulated odds
    let accumulatedOdds = 1;
    for (const oddDoc of selectedOddsDocs) {
      if (oddDoc.selectedOdd && typeof oddDoc.selectedOdd === 'number' && oddDoc.selectedOdd > 0) {
        accumulatedOdds *= oddDoc.selectedOdd;
      } else {
        // Handle case where an oddDoc might have an invalid selectedOdd value
        console.warn(`Invalid selectedOdd value in Odd document ${oddDoc._id}`);
        // Optionally, you could choose to abort or skip this odd.
        // For now, we'll let it proceed, potentially resulting in accumulatedOdds = 0 if all are invalid.
      }
    }
 
    // If no valid odds were found to multiply, or if an odd was 0, accumulatedOdds might be 1 (if only one invalid odd) or 0.
    // A bet with odds of 1 or 0 is usually not sensible.
    if (accumulatedOdds <= 1 && selectedOddsDocs.length > 0) { // Check if any valid odds were processed to make odds > 1
        // If only one selection and its odd is 1, it's a valid bet (returns stake).
        // If multiple selections result in accumulated odds of 1, or if it's 0, it's problematic.
        if (accumulatedOdds === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Cannot place bet with zero accumulated odds due to invalid selections." });
        }
        // Allow odds of 1 (e.g. a single bet at 1.00, or an accumulator that results in 1.00)
    }
 
    // 6. Calculate potential payout
    const potentialPayout = accumulatedOdds * betAmount * 50;
 
    // 7. Deduct betAmount from user's wallet
    user.walletBalance -= betAmount;
    await user.save({ session });
 
    // 8. Create the BetSlip document
    //    Note: The `oddId` field in BetSlip is singular. If this is an accumulator
    //    from multiple `Odd` docs, `oddId` might not be suitable here.
    //    You might store an array of chosen outcomes or references to `Odd` docs.
    //    For this example, we'll populate based on the accumulator.
    const oddIdsToInclude = selectedOddsDocs.map(doc => doc._id);
    const newBetSlip = new BetSlip({
      userId: userId,
      oddId: oddIdsToInclude, // This needs to be decided based on BetSlip's purpose for accumulators.
      // If BetSlip is for one Odd selection, this function needs to change.
      // If it's an accumulator, oddId might be an array of Odd._id or not used.
      totalOddsValue: parseFloat(accumulatedOdds.toFixed(2)), // Store accumulated odds, rounded
      betAmount: betAmount,
      totalBets: selectedOddsDocs.length, // Number of selections in this accumulator
      potentialPayout: parseFloat(potentialPayout.toFixed(2)), // Store potential payout, rounded
      betStatus: "pending"
    });
    await newBetSlip.save({ session });
 
    // 9. Optionally: Mark the selected Odd documents as "processed" or delete them
    // This prevents them from being included in future bet slips.
    // Example:
    // const oddIdsToProcess = selectedOddsDocs.map(doc => doc._id);
    // await Odd.deleteMany({ _id: { $in: oddIdsToProcess } }).session(session);

    // Or update their status:
    await Odd.updateMany({ _id: { $in: oddIdsToProcess } }, { $set: { status: "processed" } }).session(session);
 
    // 10. Commit the transaction
    await session.commitTransaction();
    session.endSession();
 
    res.status(201).json({
      message: "Bet placed successfully!",
      betSlip: newBetSlip
    });
    console.log(`Bet slip ${newBetSlip._id} created for user ${userId}`);

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Error in handleGetPlacedOddsAndBet:", error);
    res.status(500).json({ message: "Error placing bet.", error: error.message });
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
  handleGetPlacedOddsAndBet
  
};
