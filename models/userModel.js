const mongoose = require("mongoose")
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    email: {
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
        enum: ["user", "admin", "agent", "coach", "manager", "player" ],
        default: "user"
    },
    gender: {
        type: String,
        enum: ["male", "female", "prefer not to say" ],
        default: ""
    },
    phoneNo: {
        type: String,
        trim: true,
        unique: true,
        sparse: true, // Recommended for unique fields that might be initially empty before a pre-save hook
        validate: {
            validator: function(v) {
                if (v === null || v === '') { // Allow empty string or null if not required (though pre-save hook handles empty on new)
                    return true;
                }
                // Check if it's a 6-digit code (likely system-generated or user-entered)
                if (/^\d{6}$/.test(v)) {
                    return true;
                }
                if (!/^[+\-\(\)\s\d]*$/.test(v)) { // Checks if the string contains only valid phone characters
                    return false;
                }
                const digitCount = (v.match(/\d/g) || []).length;
                return digitCount >= 7 && digitCount <= 15;
            },
            message: props => `${props.value} is not a valid phone number. It should be a 6-digit code, or a phone number containing 7-15 digits and may include '+', '()', '-', and spaces.`
        }
    },
    country: {
        type: String,
        default: ""
    },
    interests: {
        type: [String], // Assuming multiple interests can be selected
       // enum: [ "football", "cricket", "basket ball", "tennis" ],
        default: [] // Correct default for an empty array
        // If only one interest is allowed: type: String, default: "" or one of the enum values
    }
}, 

{timestamps: true}

)

// Helper function to generate a unique 6-digit code
async function generateUniqueSixDigitCode(model, fieldName, length = 6) {
    let code;
    let isUnique = false;
    const maxAttempts = 10; // Prevent infinite loop in very unlikely collision scenarios
    let attempts = 0;
    while (!isUnique && attempts < maxAttempts) {
        // Generate a random number and pad with leading zeros if necessary
        code = crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
        const query = {};
        query[fieldName] = code;
        const existingDoc = await model.findOne(query);
        if (!existingDoc) {
            isUnique = true;
        }
        attempts++;
    }
    if (!isUnique) {
        // This error is highly unlikely for 6 digits with a reasonable number of users
        throw new Error(`Failed to generate a unique ${length}-digit code for ${fieldName} after ${maxAttempts} attempts.`);
    }
    return code;
}

userSchema.pre('save', async function(next) {
    // If phoneNo is not provided (is falsy: null, undefined, empty string) and this is a new document
    if (this.isNew && !this.phoneNo) {
        this.phoneNo = await generateUniqueSixDigitCode(mongoose.model('User'), 'phoneNo', 6);
    }
    next();
});







const User = mongoose.model("User", userSchema)

module.exports = User
