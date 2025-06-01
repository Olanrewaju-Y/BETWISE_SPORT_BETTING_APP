const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
   password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true,
        default: 18
    },
    walletBalance: {
        type: Number,
        required: true,
        default: 0
    },
    nickName: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "admin", "agent" ],
        default: "user"
    },
    gender: {
        type: String,
        enum: ["male", "female", "prefer not to say" ],
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    interests: {
        type: [String], // Assuming multiple interests can be selected
       // enum: [ "football", "cricket", "basket ball", "tennis" ],
        default: [""] // Correct default for an array type
        // If only one interest is allowed: type: String, default: "" or one of the enum values
    }
}, 

{timestamps: true}

)

const User = mongoose.model("User", userSchema)

module.exports = User
