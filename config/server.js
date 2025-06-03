


// Configuration for minimum bet amount (consider moving to a config file or .env)
const MIN_BET_AMOUNT = parseFloat(process.env.MIN_BET_AMOUNT) || 100; // Example: Default to 100 if not set

const MIN_TOPUP_AMOUNT = parseFloat(process.env.MIN_TOPUP_AMOUNT) || 1000; //



module.exports = {
    MIN_BET_AMOUNT,
    MIN_TOPUP_AMOUNT,
};

