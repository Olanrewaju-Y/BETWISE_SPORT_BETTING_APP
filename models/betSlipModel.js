const mongoose = require("mongoose")

// Imagine a BET SLIP

const betSlipSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    oddIds: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Odd",
        required: true // Each entry in the array is required
    }],
    totalOddsValue: {
        type: Number, 
        default: 0,
        required: true
    },    
    betAmount: {
        type: Number,
        default: 0,
        required: true
    },
    totalBets: {
        type: Number, 
        default: 0,
        required: true
    },
    potentialPayout: {
        type: Number, 
        default: 0,
        required: true
    },
    // betMultiplier: {
    //     type: Number, 
    //     dafault: 1,
    //     required: true
    // },
    betStatus: {
        type: String,
        enum: ["won", "lost", "pending", "void", "cancelled"], // Added enum
        default: "pending"
    }
}, 

{timestamps: true}

)



const BetSlip = mongoose.model("BetSlip", betSlipSchema)

module.exports = BetSlip
