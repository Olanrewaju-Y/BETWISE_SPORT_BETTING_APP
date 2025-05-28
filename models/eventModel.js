const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",       
        required: true
    },
    eventType: {
        type: String,
        required: true,
        enum: [ "football", "cricket", "basket ball", "tennis" ],
        default: ""
    },
    eventDescription: {
        type: String,
        required: true
    },
    eventImage: {
        type: String,
        required: true
    },
    homeTeam: {
        type: String,
        required: true,
        default: "home"
    },
    homeTeamScore: {
        type: Number,
        default: 0
    },
    homeTeamPoint: {
        type: Number,
        default: 0
    },
    drawPoint: {
        type: Number,
        default: 0
    },
    awayTeamPoint: {
        type: Number,
        default: 0
    },
    awayTeam: {
        type: String,
        required: true,
        default: "away"
    },
     awayTeamScore: {
        type: Number,
        default: 0
    },
    availableOdds: {
        type: { 
            "1x2": { "1": Number, "x": Number, "2": Number },
            doubleChance: { "1x": Number, "12": Number, "x2": Number },
            overUnder: { "over2_5": Number, "under2_5": Number },
            ggNg: { "gg": Number, "ng": Number } 
        },
        default: () => ({ // Default to an empty object or a pre-filled structure
            "1x2": { "1": null, "x": null, "2": null },
            doubleChance: { "1x": null, "12": null, "x2": null },
            overUnder: { "over2_5": null, "under2_5": null },
            ggNg: { "gg": null, "ng": null }
        })
    },
    eventStatus: {
        type: String,
        required: true,
        enum: [ "upcoming", "ongoing", "completed", "cancelled", "suspended", "ended", "expired", "deleted", "archived" ],
        default: "upcoming" // A more sensible default
    },
    eventReviews: {
        type: String,
        default: ""
    },
    eventDate: {
        type: Date,
        // required: true
    },
    eventTime: {
        type: String,
        // required: true
    }
}, 

{timestamps: true}

)

const Event = mongoose.model("Event", eventSchema)

module.exports = Event
