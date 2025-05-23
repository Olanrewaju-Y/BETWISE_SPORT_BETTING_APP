const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        required: true
    },
    paymentReference: {
        type: String,
        required: true
    },
    paymentDescription: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending"
    },
    paymentType: {
        type: String,
        enum: ["Credit Card", "PayPal", "Bank Transfer"],
        required: true
    }
},
{timestamps: true}
)

const Payment = mongoose.model("Payment", paymentSchema)

module.exports = Payment;