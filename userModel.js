const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
   password: {
        type: String,
        required: true
    },
    nickName: {
        type: String
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "admin", "agent" ],
        default: "user"
    },
    gender: {
        type: String,
        required: true,
        enum: ["male", "female", "prefer not to say" ],
        default: "prefer not to say"
    },
    above18: {
        type: Boolean,
        required: true
    },
    country: {
        type: String,
        required: true,
        default: "Nigeria"
    },
    interests: {
        type: String,
        required: true,
        enum: [ "football", "cricket", "basket ball", "tennis" ],
        default: "football"
    },
    walletBalance: {
        type: Number,
        default: 0
    }
}, 

{timestamps: true}

)

const User = mongoose.model("User", userSchema)

module.exports = User

