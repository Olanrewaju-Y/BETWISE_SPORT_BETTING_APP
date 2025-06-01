
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
