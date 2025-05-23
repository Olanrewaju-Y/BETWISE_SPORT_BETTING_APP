const mongoose = require("mongoose")

// Imagine a BET SLIP

const betSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    betOdds: {
        type: Number, // Assuming this is the numerical value of the odds
    },
     betAmount: {
        type: Number,
        required: true
    },
    betResult: {
        type: String,
        enum: ["won", "lost", "pending", "void", "cancelled"], // Added enum
        default: "pending"
    }
}, 

{timestamps: true}

)



const Bet = mongoose.model("Bet", betSchema)

module.exports = Bet
