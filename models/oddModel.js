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
            type: String,
    },
    homeTeam: {
        type: String,
    },
    awayTeam: {
        type: String,
    },
    selectedOdd: { // MOST IMPORTANTLY
        type: Number,
        default: 0,
        required: true
    },
    eventDate: {
        type: Date
    },
    eventOddStatus: {
        type: String,
        required: true,
        enum: [ "upcoming", "ongoing", "completed", "cancelled", "suspended", "ended", "expired", "deleted", "processed" ],
        default: "upcoming" // A more sensible default
    }
}, 

{timestamps: true}

)



const Odd = mongoose.model("Odd", oddSchema)

module.exports = Odd
