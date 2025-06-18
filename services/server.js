const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();
const jwt = require('jsonwebtoken');
const User = require("../models/userModel");
const mongoose = require('mongoose');
const BetSlip = require('../models/betSlipModel'); // Import BetSlip model
const Odd = require('../models/oddModel');
const Wallet = require('../models/walletModel'); // Import Wallet model for transaction logging





// Generate ACCESS token
const generateAccessToken = ( user ) => { 
const accessToken = jwt.sign(
        { id: user._id }, 
        process.env.ACCESS_TOKEN,
        { expiresIn: "15m" }
      )
      return accessToken;
}

// Generate REFRESH token
const generateRefreshToken = ( user ) => { 
const refreshToken = jwt.sign(
        { id: user._id }, 
        process.env.REFRESH_TOKEN,
        { expiresIn: "30d" }
      )

return refreshToken;
}

// Access and Refresh Secrets
const ACCESS_SECRET = process.env.REFRESH_TOKEN || "accessSecret"
const REFRESH_SECRET = process.env.REFRESH_TOKEN || "refreshSecret"


// send Forget Password Email
const sendForgetPasswordEmail = async (user, token) => { 
   
    const clientAppUrl = process.env.CLIENT_APP_URL || 'https://www.betwise.com'; // Fallback if not set
    try {
        const mailTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        })

        const mailDetails = {
            from: process.env.EMAIL, 
            to: user.email,
            subject: "Password Reset Notification",
            html: `
            <hi>Password Reset Notification</h1>

            Here is the token to reset your password please click on the button below,
            <br> 
            <br>
            <button type="button" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border: none; border-radius: 5px; cursor: pointer;"> <a style="color: white; text-decoration: none;" href='${clientAppUrl}/reset-password/${token}'>Reset Password </a></button>
            <br>
            <br>
            <br>
                if the button does not work for any reason, please click the link below
                <br>
                <a href='${clientAppUrl}/reset-password/${token}'>${clientAppUrl}/reset-password/${token}</a>
            <br>
            <br>
            <br>
            ${token}
            `
        }
       await mailTransporter.sendMail(mailDetails)
   } catch (error) {
    console.log(error);
   }
}

// Check wallet balance
const checkWalletBalance = async (userId, amountToCheck, session = null) => { // Added session parameter
    if (!userId) {
        return { sufficient: false, message: "User ID is required." };
    }
    if (typeof amountToCheck !== 'number' || amountToCheck <= 0) {
        return { sufficient: false, message: "Amount to check must be a positive number." };
    }
    try {
        const query = User.findById(userId).select('walletBalance');
        if (session) {
            query.session(session); // Use session if provided
        }
        const user = await query;

        if (!user) {
            console.warn(`User not found with ID: ${userId} for wallet balance check.`);
            return { sufficient: false, message: "User not found." };
        }

        if (user.walletBalance >= amountToCheck) {
            return { sufficient: true, currentBalance: user.walletBalance };
        } else {
            return { sufficient: false, message: "Insufficient wallet balance.", currentBalance: user.walletBalance };
        }
    } catch (error) {
        console.error(`Error checking wallet balance for user ${userId}:`, error);
        return { sufficient: false, message: "Error checking wallet balance." };
    }
};


// Helper function to extract numeric odd value from the Odd model's selectedOdd structure
function extractNumericOddValue(selectedOddObject) {
  if (!selectedOddObject || typeof selectedOddObject !== 'object') {
      console.warn("selectedOddObject is invalid:", selectedOddObject);
      return null;
  }
  let multipliedOddValue = 1; // Initialize to 1 for multiplication
  let foundNumericOdd = false;

  // Iterate over market types (e.g., "1x2", "doubleChance")
  for (const marketTypeKey in selectedOddObject) {
      // Explicitly skip a top-level _id key if it's not intended as a market type
      if (marketTypeKey === '_id') {
          continue;
      }

      if (selectedOddObject.hasOwnProperty(marketTypeKey) &&
          typeof selectedOddObject[marketTypeKey] === 'object' &&
          selectedOddObject[marketTypeKey] !== null) {
          const marketObject = selectedOddObject[marketTypeKey];
          // Iterate over specific picks within the market type (e.g., "homeTeamWinPoint", "1x")
          for (const pickKey in marketObject) {
              const oddValue = marketObject[pickKey];
              // Log the value and its type for every potential odd
              // console.log(`DEBUG extractNumericOddValue: marketTypeKey='${marketTypeKey}', pickKey='${pickKey}', value='${oddValue}', typeof='${typeof oddValue}'`);
              
              if (marketObject.hasOwnProperty(pickKey) && typeof oddValue === 'number' && !isNaN(oddValue)) { // Check if it's a number and not NaN
                  if (oddValue <= 0) { // Odds should generally be positive
                    console.warn(`Found non-positive odd value (${oddValue}) in selectedOddObject for pick ${pickKey}. Skipping this value for multiplication.`);
                    continue; // Skip non-positive odds in multiplication
                  }
                  multipliedOddValue *= oddValue; // Multiply the numeric odd value
                  foundNumericOdd = true;
              }
          }
      }
  }
  
  if (foundNumericOdd) {
    return multipliedOddValue;
  } else {
    console.warn("No numeric odd values found in selectedOddObject to multiply:", selectedOddObject);
    return null; // Return null if no valid numeric odds were found
  }
}

// Service function to update user wallet and log the transaction
const updateUserWalletAndLogTransaction = async ({
  session,
  userId,
  amountChange, // Can be positive (credit) or negative (debit)
  transactionType,
  transactionStatus = "completed",
  description,
  referenceId = null,
  metadata = {}
}) => {
  if (!session) {
    throw new Error("A Mongoose session is required for wallet transactions.");
  }
  if (!userId) {
    throw new Error("User ID is required for wallet transaction.");
  }
  if (typeof amountChange !== 'number') {
    throw new Error("Amount change must be a number for wallet transaction.");
  }
  if (!transactionType) {
    throw new Error("Transaction type is required for wallet transaction.");
  }

  const user = await User.findById(userId).session(session);
  if (!user) {
    throw new Error(`User not found with ID: ${userId} for wallet transaction.`);
  }

  const balanceBefore = user.walletBalance;

  // Apply the change to the user's wallet balance
  user.walletBalance += amountChange;

  // Ensure wallet balance doesn't go below zero if it's a debit that wasn't pre-checked
  if (user.walletBalance < 0) {
      throw new Error(`Insufficient funds. Transaction would result in a negative balance for user ${userId}. Balance before: ${balanceBefore}, Change: ${amountChange}`);
  }

  await user.save({ session });
  const balanceAfter = user.walletBalance;

  // Find or create the Wallet document for the user
  let walletDoc = await Wallet.findOne({ userId: userId }).session(session);
  if (!walletDoc) {
    walletDoc = new Wallet({ userId: userId, history: [] });
  }

  // Create the transaction log entry
  const transactionLogEntry = {
    type: transactionType,
    amount: Math.abs(amountChange), // Amount in log is always positive
    status: transactionStatus,
    description: description,
    balanceBefore: balanceBefore,
    balanceAfter: balanceAfter,
    referenceId: referenceId, // e.g., BetSlip._id as string
    metadata: metadata,       // e.g., { betSlipId: actualObjectId, eventId: ... }
    transactionDate: new Date()
  };

  walletDoc.history.push(transactionLogEntry);
  await walletDoc.save({ session });

  console.log(`Wallet transaction logged for user ${userId}: Type: ${transactionType}, Amount Change: ${amountChange}, New Balance: ${balanceAfter}`);
  return { user, wallet: walletDoc, transactionLogEntry };
};

// Helper function to settle bets for a completed event
const settleBetSlipStatus = async (eventId, finalHomeScore, finalAwayScore, session) => { // session is passed for transactional integrity
  console.log(`Attempting to settle bets for event ID: ${eventId} with score ${finalHomeScore} - ${finalAwayScore}`);

  // 1. Find all Odd documents related to the event that are in a "processed" state
  // (meaning they are part of a created bet slip).
  const relevantOddDocs = await Odd.find({
    eventId: eventId,
    eventOddStatus: "processed" // Odds are marked 'processed' when a bet slip is created
  }).select('_id').session(session);

  if (!relevantOddDocs.length) {
    console.log(`No processed odds found for event ${eventId}. No bet slips to settle based on this event.`);
    return;
  }

  const relevantOddIds = relevantOddDocs.map(o => o._id);

  // 2. Find all "pending" BetSlips that contain any of these relevant Odd IDs.
  const pendingBetSlips = await BetSlip.find({
    oddIds: { $in: relevantOddIds },
    betSlipStatus: "pending"
  }).populate('oddIds') // Populate the full Odd documents
    .session(session);

  if (pendingBetSlips.length === 0) {
    console.log(`No pending bet slips found containing odds for event ${eventId} to settle.`);
    return;
  }

  for (const betSlip of pendingBetSlips) {
    let allOddsInSlipWon = true; // Assume the accumulator wins until an odd loses

    try {        
        // Iterate over each Odd in the BetSlip to check if its selection won
      for (const oddDoc of betSlip.oddIds) {

        if (oddDoc.eventId.toString() !== eventId.toString()) {
            // This odd is for a different event, its outcome is not determined yet by this event's settlement.
            // For an accumulator to win, ALL its events must conclude and ALL selections must win.
            // If this event is just one of many, the betslip remains pending.
            // This logic might need adjustment based on how multi-event accumulators are handled.
            // For now, if an odd is not for the current event, we assume the betslip cannot be fully settled yet.
            // A more robust system might check if ALL events in the betslip are now "completed".
            // For this iteration, we'll assume a betslip is settled based on the outcome of THIS event
            // if all its odds are from this event. If not, it's more complex.
            // Let's simplify: if any odd in the slip is NOT from this event, the slip remains pending.
            // This is a safe default. A better approach would be to check if ALL events in the betslip are completed.
            // For now, we will only settle betslips where ALL odds are from the event being settled.
            const allOddsFromThisEvent = betSlip.oddIds.every(o => o.eventId.toString() === eventId.toString());
            if (!allOddsFromThisEvent) {
                allOddsInSlipWon = false; // Mark as not fully determined by this event alone
                console.log(`BetSlip ${betSlip._id} contains odds from other events. It will not be settled now.`);
                break; // Move to the next betslip
            }
        }

        let currentOddWon = false;
        const selectedMarket = oddDoc.selectedOdd;

        for (const marketType in selectedMarket) { // e.g., "1x2", "doubleChance"
          const marketPicks = selectedMarket[marketType];
          for (const pickKey in marketPicks) { // e.g., "homeTeamWinPoint", "1x"
            const oddValue = marketPicks[pickKey];
            if (typeof oddValue === 'number' && oddValue > 0) { // This is the selected pick
              // Determine if this pick won
              if (marketType === "1x2") {
                if (pickKey === "homeTeamWinPoint" && finalHomeScore > finalAwayScore) currentOddWon = true;
                else if (pickKey === "drawPoint" && finalHomeScore === finalAwayScore) currentOddWon = true;
                else if (pickKey === "awayTeamWinPoint" && finalHomeScore < finalAwayScore) currentOddWon = true;
              } else if (marketType === "doubleChance") {
                if (pickKey === "1x" && (finalHomeScore > finalAwayScore || finalHomeScore === finalAwayScore)) currentOddWon = true;
                else if (pickKey === "12" && (finalHomeScore > finalAwayScore || finalHomeScore < finalAwayScore)) currentOddWon = true;
                else if (pickKey === "x2" && (finalHomeScore === finalAwayScore || finalHomeScore < finalAwayScore)) currentOddWon = true;
              } else if (marketType === "overUnder") {
                const totalGoals = finalHomeScore + finalAwayScore;
                // Assumes pickKey is like "over2_5" or "under2_5"
                const parts = pickKey.match(/^(over|under)([0-9]+(?:_[0-9]+)?)$/i);
                if (parts && parts.length === 3) {
                  const limit = parseFloat(parts[2].replace("_", "."));
                  if (!isNaN(limit)) {
                    if (parts[1].toLowerCase() === "over" && totalGoals > limit) currentOddWon = true;
                    else if (parts[1].toLowerCase() === "under" && totalGoals < limit) currentOddWon = true;
                  }
                }
              } else if (marketType === "ggNg") {
                if (pickKey === "gg" && finalHomeScore > 0 && finalAwayScore > 0) currentOddWon = true;
                else if (pickKey === "ng" && (finalHomeScore === 0 || finalAwayScore === 0)) currentOddWon = true;
              }
              // Break from inner loops once the selected pick is found and evaluated
              break; 
            }
          }
          if (currentOddWon || (Object.values(marketPicks).some(v => typeof v === 'number' && v > 0))) break; // Found and evaluated the market
        }

        if (!currentOddWon) {
          allOddsInSlipWon = false; // If any odd in the accumulator loses, the whole slip loses
          break; // No need to check other odds in this slip
        }
      } // End of loop for odds within a betslip

      // If after checking all odds, allOddsInSlipWon is still true (and it wasn't skipped)
      if (allOddsInSlipWon && betSlip.oddIds.every(o => o.eventId.toString() === eventId.toString())) { // Ensure we are only settling if all odds were from this event
        betSlip.betSlipStatus = "won";

        // Credit user and log transaction
        await updateUserWalletAndLogTransaction({
          session,
          userId: betSlip.userId,
          amountChange: betSlip.potentialPayout, // Positive for credit
          transactionType: "bet_win_payout",
          description: `Winnings from bet slip ${betSlip._id} for event ${eventId}`,
          referenceId: betSlip._id.toString(),
          metadata: {
            betSlipId: betSlip._id,
            eventId: eventId,
            payoutAmount: betSlip.potentialPayout,
            finalScore: `${finalHomeScore}-${finalAwayScore}`
          }
        });
        console.log(`BetSlip ${betSlip._id} (User: ${betSlip.userId}) won. Credited ${betSlip.potentialPayout} and logged transaction.`);

    } else if (betSlip.oddIds.every(o => o.eventId.toString() === eventId.toString())) { // If not all odds won, but all were from this event
        betSlip.betSlipStatus = "lost";
        console.log(`BetSlip ${betSlip._id} (User: ${betSlip.userId}) lost.`);
      }
      // If the betslip was skipped because it contained odds from other events, its status remains "pending".
      if (betSlip.betSlipStatus !== "pending") { // Save if status changed
        await betSlip.save({ session });
      }

    } catch (settlementError) {
      console.error(`Error during financial transaction or status update for bet slip ${betSlip._id} for event ${eventId}:`, settlementError);
      // Decide how to handle individual bet settlement errors.
      // You might mark the bet as 'error' or 'void' and continue with others.
      // Re-throw to abort the main transaction if one bet fails critically
      throw settlementError; // This will abort the transaction
    }
  }
  console.log(`Bet settlement processing completed for event ${eventId}.`);
};
     
 











module.exports = {
    generateAccessToken,
    generateRefreshToken,
    ACCESS_SECRET,
    REFRESH_SECRET,
    sendForgetPasswordEmail,
    checkWalletBalance,
    extractNumericOddValue,
    settleBetSlipStatus,
    updateUserWalletAndLogTransaction 
}
