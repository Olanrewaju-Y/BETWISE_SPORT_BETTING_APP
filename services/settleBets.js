// Helper function to settle bets for a completed event

const settleBetsForEvent = async (eventId, finalHomeScore, finalAwayScore, session) => {
  console.log(`Attempting to settle bets for event ID: ${eventId} with score ${finalHomeScore} - ${finalAwayScore}`);

  // 1. Find all "pending" bet slips for this eventId
  const pendingBets = await BetSlip.find({ eventId, betSlipStatus: "pending" }).session(session);

  if (pendingBets.length === 0) {
    console.log(`No pending bets found for event ${eventId} to settle.`);
    return;
  }

  for (const bet of pendingBets) {
    // Ensure chosenOutcome exists and has the expected structure
    if (!bet.chosenOutcome || !bet.chosenOutcome.market || !bet.chosenOutcome.outcome) {
        console.error(`Bet ${bet._id} for event ${eventId} is missing chosenOutcome details. Skipping settlement for this bet.`);
        // Optionally, update bet status to 'void' or 'error' if this happens
        // bet.betSlipStatus = 'void'; 
        // await bet.save({ session });
        continue; 
    }

    let isWin = false;
    const { market, outcome } = bet.chosenOutcome;

    // 2. Determine if the bet is a win based on market and outcome
    try {
        if (market === "1x2") {
            if (outcome === "1" && finalHomeScore > finalAwayScore) isWin = true;
            else if (outcome === "x" && finalHomeScore === finalAwayScore) isWin = true;
            else if (outcome === "2" && finalHomeScore < finalAwayScore) isWin = true;
        } else if (market === "doubleChance") {
            if (outcome === "1x" && (finalHomeScore > finalAwayScore || finalHomeScore === finalAwayScore)) isWin = true;
            else if (outcome === "12" && (finalHomeScore > finalAwayScore || finalHomeScore < finalAwayScore)) isWin = true;
            else if (outcome === "x2" && (finalHomeScore === finalAwayScore || finalHomeScore < finalAwayScore)) isWin = true;
        } else if (market === "overUnder") {
            const totalGoals = finalHomeScore + finalAwayScore;
            // Example for "over2_5" and "under2_5". This parsing needs to be robust.
            // It assumes outcome strings like "over2_5", "under1_5"
            const parts = outcome.match(/^(over|under)([0-9]+(?:_[0-9]+)?)$/i);
            if (parts && parts.length === 3) {
                const limitStr = parts[2].replace("_", ".");
                const limit = parseFloat(limitStr);
                if (!isNaN(limit)) {
                    if (parts[1].toLowerCase() === "over" && totalGoals > limit) isWin = true;
                    else if (parts[1].toLowerCase() === "under" && totalGoals < limit) isWin = true;
                } else {
                    console.warn(`Could not parse numeric limit from overUnder outcome: ${outcome} for bet ${bet._id}`);
                }
            } else {
                console.warn(`Could not parse overUnder outcome format: ${outcome} for bet ${bet._id}`);
            }
        } else if (market === "ggNg") {
            if (outcome === "gg" && finalHomeScore > 0 && finalAwayScore > 0) isWin = true;
            else if (outcome === "ng" && (finalHomeScore === 0 || finalAwayScore === 0)) isWin = true;
        }
        // Add more market types (e.g., correct score, handicaps) here if needed

        if (isWin) {
            bet.betSlipStatus = "won";
            const payout = bet.betSlipAmount * bet.betSlipOdds;
            // 3. Update user's wallet balance
            await User.findByIdAndUpdate(bet.userId, { $inc: { walletBalance: payout } }, { session });
            console.log(`Bet ${bet._id} (User: ${bet.userId}) won. Credited ${payout}.`);
        } else {
            bet.betSlipStatus = "lost";
            console.log(`Bet ${bet._id} (User: ${bet.userId}) lost.`);
        }
        await bet.save({ session });

    } catch (settlementError) {
        console.error(`Error settling bet ${bet._id} for event ${eventId}:`, settlementError);
        // Decide how to handle individual bet settlement errors.
        // You might mark the bet as 'error' or 'void' and continue with others.
        // Re-throw to abort the main transaction if one bet fails critically
        throw settlementError; 
    }
  }
  console.log(`Bet settlement processing completed for event ${eventId}.`);
}








// const handleUpdateGameResult = async (req, res) => { // Renamed function
//   const eventId = req.params.id;
//   const { homeTeamPoint, drawPoint, awayTeamPoint, homeTeamScore, awayTeamScore, eventStatus } = req.body;

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const updateFields = {};

//     if (homeTeamScore !== undefined) {
//       if (typeof homeTeamScore !== 'number' || homeTeamScore < 0) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({ message: "homeTeamScore must be a non-negative number." });
//       }
//       updateFields.homeTeamScore = homeTeamScore;

//     if (homeTeamPoint !== undefined) {
//       if (typeof homeTeamPoint !== 'number' || homeTeamPoint < 0) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({ message: "homeTeamPoint must be a non-negative number." });
//       }
//       updateFields.homeTeamPoint = homeTeamPoint;
//     }

//     if (drawPoint !== undefined) {
//       if (typeof drawPoint !== 'number' || drawPoint < 0) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({ message: "drawPoint must be a non-negative number." });
//       }
//       updateFields.drawPoint = drawPoint;
//     }

//     if (awayTeamPoint !== undefined) {
//       if (typeof awayTeamPoint !== 'number' || awayTeamPoint < 0) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({ message: "awayTeamPoint must be a non-negative number." });
//       }
//       updateFields.awayTeamPoint = awayTeamPoint;
//     }

//     if (awayTeamScore !== undefined) {
//       if (typeof awayTeamScore !== 'number' || awayTeamScore < 0) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({ message: "awayTeamScore must be a non-negative number." });
//       }
//       updateFields.awayTeamScore = awayTeamScore;
//     }

//     if (eventStatus !== undefined) {
//       const allowedEventStatuses = Event.schema.path('eventStatus').enumValues;
//       if (!allowedEventStatuses.includes(eventStatus)) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({
//             message: `Invalid eventStatus. Must be one of: ${allowedEventStatuses.join(', ')}`
//         });
//       }
//       updateFields.eventStatus = eventStatus;
//     }

//     if (Object.keys(updateFields).length === 0) {
//       // No DB operation would have started, but good practice to manage session
//       session.endSession(); // No transaction to abort if no fields.
//       return res.status(400).json({ message: "No valid fields provided for update." });
//     }

//     const updatedEvent = await Event.findByIdAndUpdate(
//       eventId,
//       { $set: updateFields },
//       { new: true, runValidators: true }
//       { new: true, runValidators: true, session: session } // Run in session
//     );

//     if (!updatedEvent) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "Event not found." });
//     }

//     // --- Bet Settlement Logic Trigger ---
//     const finalStatusesForSettlement = ["completed", "ended"]; // Define statuses that trigger settlement
//     // Settle bets if the event status is updated to a final one AND scores are definitively set.
//     if (updateFields.eventStatus && finalStatusesForSettlement.includes(updatedEvent.eventStatus)) {
//         const finalHomeScore = updatedEvent.homeTeamScore; // Use score from the updated event
//         const finalAwayScore = updatedEvent.awayTeamScore; // Use score from the updated event

//         if (typeof finalHomeScore === 'number' && typeof finalAwayScore === 'number') {
//             await settleBetsForEvent(updatedEvent._id, finalHomeScore, finalAwayScore, session);
//         } else {
//             console.warn(`Event ${updatedEvent._id} marked as ${updatedEvent.eventStatus} but scores are missing/invalid. Bets not settled.`);
//             // Consider if this scenario should abort the transaction.
//             // For now, status update is allowed, but a warning is logged.
//         }
//     }

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json(updatedEvent);
//     console.log(`Event ${updatedEvent._id} updated successfully. New status: ${updatedEvent.eventStatus}`);
//   } catch (error) {
//     if (error.name === 'ValidationError') {
//         return res.status(400).json({ message: "Validation failed.", errors: error.errors });
//     }
//     console.error("Error in handleUpdateGameResult:", error);
//     res.status(500).json({ message: "Error updating event.", error: error.message });
//     // Ensure transaction is aborted on any error
//     await session.abortTransaction();
//     session.endSession();

//     console.error("Error in handleUpdateGameResult:", error);
//     let statusCode = 500;
//     let responseMessage = `Error updating event: ${error.message}`;
//     if (error.name === 'CastError' && error.path === '_id') statusCode = 400;
//     if (error.name === 'ValidationError') statusCode = 400;
//     res.status(statusCode).json({ message: responseMessage, ...(error.errors && { errors: error.errors }) });
//   }
// }
// };
