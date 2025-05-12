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
    betStatus: {
        type: String,
        required: true,
        enum: [ "upcoming", "ongoing", "completed", "cancelled", "suspended", "ended", "expired", "deleted", "archived" ],
        default: "upcoming"
    },
    betOdds: {
        type: String,
        required: true,
        enum: [ "win", "draw", "lose", "over", "under", "goal" ],
        default: "win"
    },
     betAmount: {
        type: Number,
        required: true,
        default: 0
    },
    betResult: {
        type: String,
        required: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    updatedDate: {
        type: Date,
        default: Date.now
    }
}, 

{timestamps: true}

)



const Bet = mongoose.model("Bet", betSchema)

module.exports = Bet
