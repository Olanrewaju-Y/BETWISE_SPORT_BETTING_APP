const mongoose = require("mongoose")

// this will generate an Id for all the selected games odd placed

const oddSchema = new mongoose.Schema({
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
    eventType: {
            type: String
    },
    homeTeam: {
        type: String
    },
    awayTeam: {
        type: String
    },
    selectedOdd: {
        type: { 
            "1x2": { 
                homeTeamWinPoint: Number, // or "1"
                drawPoint: Number,        // or "x"
                awayTeamWinPoint: Number  // or "2"
            },
            doubleChance: { "1x": Number, "12": Number, "x2": Number },
            overUnder: { "over2_5": Number, "under2_5": Number },
            ggNg: { "gg": Number, "ng": Number } 
        },
        default: () => ({ // Default to an empty object or a pre-filled structure
            "1x2": { 
                homeTeamWinPoint: null, 
                drawPoint: null, 
                awayTeamWinPoint: null 
            },
            doubleChance: { "1x": null, "12": null, "x2": null },
            overUnder: { "over2_5": null, "under2_5": null },
            ggNg: { "gg": null, "ng": null }
        })
    },
    totalSelectedOddsValue: {
        type: Number,
        required: true
    },
    eventDate: {
        type: Date
    },
    eventOddStatus: {
        type: String,
        required: true,
        enum: [ "upcoming", "ongoing", "completed", "cancelled", "suspended", "ended", "expired", "deleted", "processed" ],
        default: "upcoming" 
    }
}, 

{timestamps: true}

)



const Odd = mongoose.model("Odd", oddSchema)

module.exports = Odd
