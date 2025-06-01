const mongoose = require("mongoose")

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    walletBalance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creditWallet: {
            type: {
                amount: {
                    type: Number,
                    required: true
                },
                date: {
                    type: Date,
                    required: true
                },
                reference: {
                    type: String,
                    required: true
                },
                description: {
                    type: String,
                    required: true
                },
                status: {
                    type: String
            }
        }
        },
    cashOutWallet: {
        type: {
            amount: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                required: true
            },
            reference: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            status: {
                type: String
        }
    }
    },





    // walletHistory: {
    //     type: String,
    //     ref: 'User',
    //     required: true
    // },
    // betSlipId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'BetSlip',
    //     required: true
    // },
    // betSlipHistory: {
    //     type: String,
    //     ref: 'BetSlip',
    //     required: true
    // },    
    walletCreditAmount: {
        type: Number,
        required: true
    },
    walletDebitAmount: {
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

const Wallet = mongoose.model("Wallet", walletSchema)

module.exports = Wallet;