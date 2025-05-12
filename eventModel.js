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
        default: "football"
    },
    eventTitle: {
        type: String,
        required: true
    },
    eventDescription: {
        type: String,
        required: true
    },
    eventImage: {
        type: String,
        required: true
    },
    eventLocation: {
        type: String,
        required: true
    },
    eventStatus: {
        type: String,
        required: true,
        enum: [ "upcoming", "ongoing", "completed", "cancelled", "suspended", "ended", "expired", "deleted", "archived", "on-review" ],
        default: "upcoming"
    },
    eventReviews: {
        type: String,
        default: "no reviews yet"
    },
    eventDate: {
        type: Date,
        required: true
    },
    eventTime: {
        type: String,
        required: true
    }
}, 

{timestamps: true}

)

const Event = mongoose.model("Event", eventSchema)

module.exports = Event

