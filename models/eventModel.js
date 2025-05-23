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
    homeTeamOdd: {
        type: { 
            "1x2": { "1": String, "x": String, "2": String }, 
            doubleChance: { "1x": String, "12": String, "x2": String }, 
            overUnder: { "over2_5": String, "under2_5": String},
            ggNg: { "gg": String, "ng": String } 
        },
        default: () => ({ // Default to an empty object or a pre-filled structure
            "1x2": { "1": "","x": "", "2": ""},
            doubleChance: { "1x": "","12": "", "x2": ""},
            overUnder: {"over2_5": "", "under2_5": ""},
            ggNg: { "gg": "","ng": "" }
        })
    },
    awayTeam: {
        type: String,
        required: true,
        default: "away"
    },
    awayTeamOdd: {
        type: { 
            "1x2": { "1": String, "x": String, "2": String },
            doubleChance: { "1x": String, "12": String, "x2": String },
            overUnder: { "over2_5": String, "under2_5": String },
            ggNg: { "gg": String, "ng": String }
        },
        default: () => ({
            "1x2": { "1": "","x": "", "2": ""},
            doubleChance: { "1x": "","12": "", "x2": ""},
            overUnder: {"over2_5": "", "under2_5": ""},
            ggNg: { "gg": "","ng": "" }
        })
    },
    amount: {
        type: Number,
        required: true,
        default: 0
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
