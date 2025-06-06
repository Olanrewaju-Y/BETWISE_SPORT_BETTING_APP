const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const Event = require("../models/eventModel");
const Odd = require("../models/oddModel");
const BetSlip = require("../models/betSlipModel");
const Wallet = require("../models/walletModel");
const {
  sendForgetPasswordEmail,
  generateAccessToken,
  generateRefreshToken,
  extractNumericOddValue,
  settleBetSlipStatus,
  checkWalletBalance,
  updateUserWalletAndLogTransaction,
} = require("../services/server");
const mongoose = require("mongoose");
const { MIN_BET_AMOUNT, MIN_TOPUP_AMOUNT } = require("../config/server");
const axios = require("axios");
const crypto = require('crypto'); // Needed for proper HMAC signature verification
const CLIENT_APP_URL = process.env.CLIENT_APP_URL;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

// Constants for Flutterwave Payments
const FLUTTERWAVE_PAYMENT_API_URL = "https://api.flutterwave.com/v3/payments";
const FLUTTERWAVE_VERIFY_TRANSACTION_URL_BASE =
  "https://api.flutterwave.com/v3/transactions";
const DEFAULT_PAYMENT_CURRENCY = "NGN";
const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH; // Ensure you have this in your .env and Flutterwave dashboard




// PAYMENTS

// Wallet and Payment History
const handlePaymentHistory = async (req, res) => {
  const userId = req.user.id;
  const {
    limit,
    skip,
    sortBy = "transactionDate",
    sortOrder = "desc",
    transactionType, // New filter: e.g., 'wallet_top_up', 'bet_placement'
    status,         // New filter: e.g., 'successful', 'pending', 'failed' (if applicable to wallet history entries)
    startDate,      // New filter: e.g., '2023-01-01'
    endDate,        // New filter: e.g., '2023-01-31'
  } = req.query;

  try {
    // Find the single wallet document for the user
    const wallet = await Wallet.findOne({ userId: userId });

    if (!wallet || !wallet.history || wallet.history.length === 0) {
      return res.status(200).json({
        message: "No payment history found for this user.",
        transactions: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
      });
    }

    // Apply filters
    let filteredHistory = [...wallet.history]; // Start with a copy of all history

    if (transactionType) {
      filteredHistory = filteredHistory.filter(
        (t) => t.transactionType === transactionType
      );
    }

    if (status) {
      // Note: 'status' might not be present on all transaction history entries.
      // Adjust this if your schema has a consistent status field.
      filteredHistory = filteredHistory.filter((t) => t.status === status);
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Set to beginning of the day
      filteredHistory = filteredHistory.filter((t) => new Date(t.transactionDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of the day
      filteredHistory = filteredHistory.filter((t) => new Date(t.transactionDate) <= end);
    }

    let sortedHistory = filteredHistory; // Sort the filtered results
    sortedHistory.sort((a, b) => {
      const valA = a[sortBy] || 0; // Fallback for missing sort field
      const valB = b[sortBy] || 0;
      if (sortOrder === "asc") {
        return valA < valB ? -1 : valA > valB ? 1 : 0;
      } else { // desc
        return valA > valB ? -1 : valA < valB ? 1 : 0;
      }
    });

    // Apply pagination
    const parsedSkip = parseInt(skip, 10) || 0;
    const parsedLimit = parseInt(limit, 10) || 10; // Default limit to 10 if not provided

    const paginatedTransactions = sortedHistory.slice(
      parsedSkip,
      parsedSkip + parsedLimit
    );
    const totalCount = filteredHistory.length; // Total count of filtered items

    res.status(200).json({
      message: "Payment history fetched successfully.",
      transactions: paginatedTransactions,
      totalCount: totalCount,
      currentPage: totalCount > 0 ? Math.floor(parsedSkip / parsedLimit) + 1 : 1,
      totalPages: Math.ceil(totalCount / parsedLimit),
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Error fetching payment history.", error: error.message });
  }
}

// Credit User Wallet
const handleCreditUserWallet = async (req, res) => {
  const { targetUserId, amount, description } = req.body; // Admin specifies whose wallet, how much, and why
  const adminUserId = req.user.id; // The admin performing the action

  if (!targetUserId || typeof amount !== "number" || amount <= 0) {
    return res
      .status(400)
      .json({ message: "Target User ID and a positive amount are required." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const targetUser = await User.findById(targetUserId).session(session); // Ensure user exists
    if (!targetUser) {
      await session.abortTransaction();
      // session.endSession(); // Rely on finally block
      return res.status(404).json({ message: "Target user not found." });
    }

    const { user: updatedUser, transactionLogEntry } =
      await updateUserWalletAndLogTransaction({
        session,
        userId: targetUserId,
        amountChange: amount, // Positive for credit
        transactionType: "admin_credit",
        description: description || `Manual credit by admin ${adminUserId}`,
        referenceId: null, // Or an admin action ID if you track those
        metadata: {
          adminUserId: adminUserId,
          reason: description || "Manual credit by administrator",
        },
      });

    await session.commitTransaction();
    res.status(200).json({
      message: `User ${updatedUser.userName}'s wallet credited successfully.`,
      newBalance: updatedUser.walletBalance,
      transaction: transactionLogEntry,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Error in handleCreditUserWallet:", error);
    res
      .status(500)
      .json({ message: "Error crediting user wallet.", error: error.message });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// Credit wallet from Bank
const handleCreditWalletFromBank = async (req, res) => {
  const userId = req.user.id; 
  const { amount } = req.body; 

  // 1. Validate input
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      message: "Invalid amount provided. Amount must be a positive number.",
    });
  }
  if (amount < MIN_TOPUP_AMOUNT) {
    return res.status(400).json({
      message: `Amount must be at least ${MIN_TOPUP_AMOUNT} ${DEFAULT_PAYMENT_CURRENCY}.`,
    });
  }

  let userForPayment;
  try {
    userForPayment = await User.findById(userId).lean();
    if (!userForPayment) {
      return res.status(404).json({ message: "Authenticated user not found." });
    }
  } catch (dbError) {
    console.error("Error fetching user for payment:", dbError);
    return res.status(500).json({ message: "Error retrieving user details." });
  }

  // Use details from the authenticated user's profile
  const customerEmail = userForPayment.userName; // Assuming userName is the email
  const customerName = userForPayment.nickName || userForPayment.userName; // Fallback for name
  const customerPhone = userForPayment.phoneNo; // Use the stored phoneNo

  if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) {
    // This should ideally not happen if userName is validated on signup
    return res.status(400).json({ message: "User profile has an invalid email format." });
  }
  // phoneNo might be a 6-digit code or a full number, Flutterwave might validate it further.

  const tx_ref = `betwise-topup-${userId}-${Date.now()}`;

  try {
    const paymentPayload = {
      tx_ref: tx_ref,
      amount: amount, // Use validated amount from request
      currency: DEFAULT_PAYMENT_CURRENCY, 
      redirect_url: `${CLIENT_APP_URL}/api/payment/payment-callback`, // Ensure CLIENT_APP_URL is correctly set
      payment_options: "card", // This could also be configurable
      customer: {
        email: customerEmail,
        phone_number: customerPhone,
        name: customerName,
      },
      customizations: {
        title: "BetWise Wallet Top-up",
        description: "Credit your BetWise Wallet Account",
      },
    };

    const response = await axios.post(
      FLUTTERWAVE_PAYMENT_API_URL,
      paymentPayload,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`, // Use defined constant
          "Content-Type": "application/json",
        },
      }
    );

    if (
      response.data &&
      response.data.status === "success" &&
      response.data.data &&
      response.data.data.link
    ) {
      res.status(200).json({ link: response.data.data.link, tx_ref: tx_ref });
    } else {
      console.error(
        "Flutterwave payment initiation response unexpected structure:",
        response.data
      );
      res.status(500).json({
        message:
          "Failed to initiate payment. Unexpected response from payment provider.",
      });
    }
  } catch (error) {
    console.error("Error in handleCreditWalletFromBank:", error.message);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        "Flutterwave API Error Response Data:",
        error.response.data
      );
      console.error(
        "Flutterwave API Error Response Status:",
        error.response.status
      );
      res.status(error.response.status || 500).json({
        message: "Failed to initiate payment with provider.",
        details: error.response.data
          ? error.response.data.message
          : "Payment provider error",
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Flutterwave API No Response:", error.request);
      res.status(503).json({
        message: "Payment provider service unavailable. No response received.",
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Axios Request Setup Error:", error.message);
      res.status(500).json({ message: "Error setting up payment request." });
    }
  }
};

// handle Payment callback
const handlePaymentCallback = async (req, res) => {
  const {
    transaction_id: transactionId,
    tx_ref: clientTxRef,
    status: clientStatus,
  } = req.query;

  console.log(`[Callback] Received callback for transaction_id: ${transactionId}, tx_ref: ${clientTxRef}, status: ${clientStatus}`);
  if (!transactionId) {
    console.warn("Payment callback received without transaction_id.");
    return res.redirect(
      `${CLIENT_APP_URL}/payment-failed?status=error&reason=missing_transaction_id`
    );
  }
  if (!clientTxRef) {
    console.warn("Payment callback received without tx_ref.");
    return res.redirect(
      `${CLIENT_APP_URL}/payment-failed?status=error&reason=missing_tx_ref&transaction_id=${transactionId}`
    );
  }

  // If Flutterwave indicates failure directly in query params, we can redirect early.
  // However, always verify with the server-to-server call for security.
  if (
    clientStatus &&
    clientStatus !== "successful" &&
    clientStatus !== "completed"
  ) {
    // Flutterwave might use 'completed'
    console.warn(
      `Payment callback received with client status: ${clientStatus} for tx_ref: ${clientTxRef}`
    );
    // Still proceed to verify, but this is an early indicator.
  }

  let session;

  try {
    console.log(`[Callback] Starting Mongoose session and transaction for TxID: ${transactionId}`);

   session = await mongoose.startSession();
       session.startTransaction();


    // 1. Verify the transaction with Flutterwave
    const verifyResponse = await axios.get(
      `${FLUTTERWAVE_VERIFY_TRANSACTION_URL_BASE}/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );
    console.log(`[Callback] Flutterwave verification response status: ${verifyResponse.data.status} for TxID: ${transactionId}`);

    if (
      !verifyResponse.data ||
      verifyResponse.data.status !== "success" ||
      !verifyResponse.data.data
    ) {
      console.error(
        "Flutterwave verification API call failed or returned unexpected data:",
        verifyResponse.data
      );
      return res.redirect(
        `${CLIENT_APP_URL}/payment-failed?status=error&reason=verification_failed&tx_ref=${clientTxRef}`
      );
    }

    const {
      status,
      currency: verifiedCurrency,
      amount: verifiedAmount,
      tx_ref: verifiedTxRef,
      id: verifiedTransactionId,
    } = verifyResponse.data.data;

    console.log(`[Callback] Verified data - Status: ${status}, Amount: ${verifiedAmount}, Currency: ${verifiedCurrency}, TxRef: ${verifiedTxRef}, TxID: ${verifiedTransactionId}`);
    // 2. Security Check: Compare clientTxRef with verifiedTxRef
    if (clientTxRef !== verifiedTxRef) {
      console.error(
        `Transaction reference mismatch. Client: ${clientTxRef}, Flutterwave: ${verifiedTxRef}`
      );
      return res.redirect(
        `${CLIENT_APP_URL}/payment-failed?status=error&reason=tx_ref_mismatch&tx_ref=${clientTxRef}`
      );
    }

    // 3. Parse userId from the verifiedTxRef
    const txRefParts = verifiedTxRef ? verifiedTxRef.split("-") : [];
    // Assuming tx_ref format is 'betwise-topup-{userId}-{timestamp}'
    const userIdToCredit =
      txRefParts.length >= 3 &&
      txRefParts[0] === "betwise" &&
      txRefParts[1] === "topup"
        ? txRefParts[2]
        : null;

    if (!userIdToCredit || !mongoose.Types.ObjectId.isValid(userIdToCredit)) {
      console.error(
        "Error parsing valid userId from verifiedTxRef:",
        verifiedTxRef
      );
      return res.redirect(
        `${CLIENT_APP_URL}/payment-failed?status=error&reason=invalid_user_in_tx_ref&tx_ref=${verifiedTxRef}`
      );
    }

   // 5. Fetch the user's wallet *within the session* (or create it) and perform Idempotency Check
    // Use findOneAndUpdate with upsert:true to create the wallet if it doesn't exist yet
    console.log(`[Callback] Attempting to find/create wallet for user ${userIdToCredit} within session for TxID: ${transactionId}`);
    const existingWallet = await Wallet.findOneAndUpdate(
        { userId: userIdToCredit },
        { $setOnInsert: { userId: userIdToCredit, history: [] } }, // Create if not exists
        { upsert: true, new: true, session: session } // Important: use session and return new doc
    );
    console.log(`[Callback] Wallet found/created for user ${userIdToCredit}. Wallet ID: ${existingWallet._id} for TxID: ${transactionId}`);
   
    if (existingWallet) {
      const existingTransaction = existingWallet.history.find(
        (entry) =>
         entry.referenceId === transactionId.toString() && // Check against Flutterwave TxID
          entry.transactionType === "wallet_top_up" // Check against the transaction type used for this flow
      );
      if (existingTransaction) {
        console.warn( // Changed to warn as this indicates a potential issue/retry
          `Duplicate callback for already processed transaction: ${transactionId} for user ${userIdToCredit}. Status: ${
          existingTransaction.status || "processed"
          }`
        );
        // Redirect based on the original outcome if possible, or just to a generic success/info page.
        // For simplicity, redirecting to success, assuming it was successful.
        return res.redirect(
          `${CLIENT_APP_URL}/payment-success?status=already_processed&tx_ref=${verifiedTxRef}`
        );
        // Note: The session is implicitly ended by the redirect and return.
      }
    }

    // 6. Validate payment status and details from verification
    if (
      status === "successful" &&
      verifiedCurrency === DEFAULT_PAYMENT_CURRENCY && // Use verified currency
      verifiedAmount >= MIN_TOPUP_AMOUNT // Use verified amount from Flutterwave
    ) {
      console.log(`[Callback] Payment criteria met. Crediting wallet for user ${userIdToCredit}, amount ${verifiedAmount} for TxID: ${transactionId}`);
      // 7. Credit user's wallet and log transaction
      const { user: updatedUser, transactionLogEntry } = // updateUserWalletAndLogTransaction should use the session
        await updateUserWalletAndLogTransaction({
          session, // Pass the initialized session
          userId: userIdToCredit, // Use the correct userId
          amountChange: verifiedAmount, // Credit the verified amount
          transactionType: "wallet_top_up",
          description: `Wallet top-up via Flutterwave. TxID: ${transactionId}`,
          referenceId: transactionId.toString(), // Flutterwave's transaction_id
          metadata: {
            flutterwaveTransactionId: transactionId.toString(),
            gateway: "flutterwave",
            amount: verifiedAmount,
            currency: verifiedCurrency,
            tx_ref: verifiedTxRef,
          },
        });

      console.log(`[Callback] Wallet update and log successful for user ${userIdToCredit}. Committing transaction for TxID: ${transactionId}`);
          // 8. Commit the transaction
      await session.commitTransaction();
      res.redirect(
        `${CLIENT_APP_URL}/payment-success?status=success&tx_ref=${verifiedTxRef}`
      );
      console.log(
        `Wallet top-up successful for user ${userIdToCredit}. Amount: ${verifiedAmount} ${verifiedCurrency}. TxID: ${transactionId}`
      );
    } else {
      // Payment failed at Flutterwave or did not meet criteria
      // 8. Abort the transaction
      console.warn(`[Callback] Payment criteria NOT met. Aborting transaction for user ${userIdToCredit}, TxID: ${transactionId}. Status: ${status}`);
      await session.abortTransaction();
      console.warn(
        `Wallet top-up failed for user ${userIdToCredit}. Flutterwave Status: ${status}, Amount: ${verifiedAmount}, Currency: ${verifiedCurrency}, TxRef: ${verifiedTxRef}. TxID: ${transactionId}`
      );
      res.redirect(
        `${CLIENT_APP_URL}/payment-failed?status=${
          status || "failed"
        }&reason=payment_criteria_not_met&tx_ref=${verifiedTxRef}&transaction_id=${transactionId}`
      );
    }
  } catch (error) {
     // Ensure session is aborted if an error occurs before commit/abort   
    if (session && session.inTransaction()) {
      console.error(`[Callback] Caught error, attempting to abort transaction for TxID: ${transactionId}`);
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error(
          "Error aborting transaction in handlePaymentCallback:",
          abortError
        );
      }
    }
    console.error(`[Callback] Critical error processing callback for TxID: ${transactionId || clientTxRef || 'unknown'}:`, error);
    console.error("Critical error in handlePaymentCallback:", error.message);
    if (error.response) {
      // Axios error
      console.error("Flutterwave API Error Data:", error.response.data);
      console.error("Flutterwave API Error Status:", error.response.status);
    }
    res.redirect(
      `${CLIENT_APP_URL}/payment-failed?status=error&reason=internal_server_error&tx_ref=${
        clientTxRef || "unknown"
      }&transaction_id=${transactionId || "unknown"}`
    );
  } finally {
     // Ensure session is always ended
    if (session) {
      console.log(`[Callback] Ending session for TxID: ${transactionId || clientTxRef || 'unknown'}`);
      try {
        await session.endSession();
      } catch (endSessionError) {
        console.error(
          "Error ending session in handlePaymentCallback:",
          endSessionError
        );
      }
    }
  }
};

// handle Flutterwave BankTransfer Webhook
const handleFlutterwaveBankTransferWebhook = async (req, res) => {
  // 1. Verify the Webhook (Security First!)
  // This is CRITICAL for security. You must verify the request is from Flutterwave.
  // Flutterwave sends a signature in a header (commonly 'verif-hash').
  // You compare this signature to a hash generated using your secret hash and the request body.
  // Consult Flutterwave documentation for the exact header name and hashing algorithm.

 const flutterwaveSignature = req.headers["verif-hash"]; // EXAMPLE: Replace 'verif-hash' with the actual header name from Flutterwave documentation.

  if (!FLW_SECRET_HASH) {
      console.error("FLW_SECRET_HASH is not set in environment variables. Webhook verification skipped (DANGEROUS!).");
      // In production, you should likely return 500 or 401 if verification cannot be performed.
      // For now, allow processing in dev if hash is missing, but log heavily.
  } else {
     // --- CRITICAL: Implement Flutterwave's Recommended Signature Verification ---
    // This is a common way to verify HMAC SHA256 signatures.
    // Flutterwave's documentation is the definitive source for their specific method.

    // IMPORTANT: For reliable HMAC generation, you often need the RAW request body,
    // as parsing and re-stringifying JSON (`JSON.stringify(req.body)`) can alter it
    // (e.g., whitespace, key order) and lead to signature mismatches.
    // Consider using middleware like `express.raw({ type: 'application/json' })`
    // for this webhook route to access `req.rawBody`.
    // If `req.rawBody` is not available, `JSON.stringify(req.body)` is a fallback,
    // but ensure Flutterwave signs the stringified JSON in that case.

    const requestBodyString = req.rawBody || JSON.stringify(req.body); // Prefer req.rawBody if available
    const expectedSignature = crypto
      .createHmac('sha256', FLW_SECRET_HASH) // Use the algorithm specified by Flutterwave (e.g., 'sha256')
      .update(requestBodyString)
      .digest('hex');

    if (flutterwaveSignature !== expectedSignature) {
    console.warn(`Invalid Flutterwave webhook signature. Expected: ${expectedSignature}, Got: ${flutterwaveSignature}`);
    return res.status(401).send("Invalid signature"); // Unauthorized
    }
  }
  console.log("Received and verified Flutterwave Webhook."); // Log after verification

  const eventData = req.body; // The payload from Flutterwave

  // 2. Extract Necessary Information from Flutterwave's Payload
  // The exact structure of eventData depends on Flutterwave's webhook format for this type of payment.
  // You'll need to consult their documentation.
  // Let's assume it contains:
  // - eventData.status (e.g., "successful")
  // - eventData.data.tx_ref (their transaction reference)
  // - eventData.data.amount (the amount paid)
  // - eventData.data.currency
  // - eventData.data.customer.phone_number or a custom field containing the BetWise User ID (your `phoneNo`)
  //   Let's assume it's in `eventData.data.meta.betwise_user_id` or similar.

  if (!eventData || !eventData.data) {
    console.error("Flutterwave webhook: Invalid payload structure.");
    return res.status(400).send("Invalid payload"); // Bad Request
  }

  const paymentStatus = eventData.data.status;
  const gatewayTransactionId = eventData.data.id || eventData.data.tx_ref; // Use Flutterwave's unique transaction ID
  const amountPaid = eventData.data.amount;
  const currencyPaid = eventData.data.currency;
  // This is the CRITICAL part: How Flutterwave sends your user's ID.
  // This needs to be confirmed with Flutterwave's documentation for the specific product.
  // For this example, let's assume it's passed in a metadata field or a specific customer identifier field.
  const betwiseUserIdToCredit = eventData.data.customer_identifier || eventData.data.meta?.betwise_user_id || eventData.data.customer?.phone_number;
  // The field above (`customer_identifier`, `meta.betwise_user_id`, `customer.phone_number`) is HYPOTHETICAL.
  // You MUST check Flutterwave's documentation for how they pass this custom recipient ID.

  if (!betwiseUserIdToCredit || typeof betwiseUserIdToCredit !== 'string') { // Ensure it's a string ID
    console.error("Flutterwave webhook: BetWise User ID not found in payload.", eventData.data);
    return res.status(400).send("Recipient user ID missing or invalid"); // Bad Request
  }

  if (paymentStatus !== "successful") {
    console.log(`Flutterwave webhook: Payment not successful for TxID ${gatewayTransactionId}. Status: ${paymentStatus}`);
    // Acknowledge receipt even for non-successful statuses to prevent retries.
    return res.status(200).send("Webhook received, payment not successful.");
  }

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    // 3. Find the User by their BetWise ID (`phoneNo`)
    // Use the session when finding the user
    const userToCredit = await User.findOne({ phoneNo: betwiseUserIdToCredit }).session(session); // Use phoneNo as the identifier


    if (!userToCredit) {
      console.error(`Flutterwave webhook: User not found with BetWise ID (phoneNo): ${betwiseUserIdToCredit}`);
      await session.abortTransaction();
      // Still send 200 OK to Flutterwave to stop retries, but log the error for investigation.
      return res.status(200).send("Webhook received, user not found.");
    }

        // 4. Idempotency Check (Refined: Check specific user's wallet)
    const userWallet = await Wallet.findOne({ userId: userToCredit._id }).session(session);
    if (userWallet && userWallet.history.some(h => h.referenceId === gatewayTransactionId.toString() && h.transactionType === "wallet_top_up_bank_transfer")) {
        console.log(`Flutterwave webhook: Transaction ${gatewayTransactionId} already processed for user ${userToCredit._id}.`);
        await session.abortTransaction(); // Abort the new transaction
        return res.status(200).send("Transaction already processed"); // Acknowledge duplicate
    }

    // 5. Validate Amount and Currency (optional, but good practice)
    if (currencyPaid !== DEFAULT_PAYMENT_CURRENCY) {
      console.warn(`Flutterwave webhook: Currency mismatch for TxID ${gatewayTransactionId}. Expected ${DEFAULT_PAYMENT_CURRENCY}, got ${currencyPaid}`);
      await session.abortTransaction();
      return res.status(200).send("Webhook received, currency mismatch."); // Acknowledge but don't process
    }
    // Check minimum amount if applicable to this direct bank transfer flow
    if (amountPaid < MIN_TOPUP_AMOUNT) {
        console.warn(`Flutterwave webhook: Amount below minimum for TxID ${gatewayTransactionId}. Amount: ${amountPaid}, Min: ${MIN_TOPUP_AMOUNT}`);
        await session.abortTransaction();
        return res.status(200).send("Webhook received, amount below minimum."); // Acknowledge but don't process
    }
    
    // 6. Credit the User's Wallet
    const { transactionLogEntry } = await updateUserWalletAndLogTransaction({
      session,
      userId: userToCredit._id,
      amountChange: amountPaid,
      transactionType: "wallet_top_up_bank_transfer", // A new type for this flow
      description: `Wallet top-up via bank transfer. Flutterwave TxID: ${gatewayTransactionId}`,
      referenceId: gatewayTransactionId.toString(),
      metadata: {
        flutterwaveTransactionId: gatewayTransactionId.toString(),
        gateway: "flutterwave-bank-transfer",
        amount: amountPaid,
        currency: currencyPaid,
        payer_info: eventData.data.customer // Log whatever customer info Flutterwave provides
      },
    });

    await session.commitTransaction();
    console.log(`Wallet credited for user ${userToCredit.userName} (ID: ${betwiseUserIdToCredit}) via bank transfer. Amount: ${amountPaid}. TxLog: ${transactionLogEntry._id}`);
    
    // 7. Respond to Flutterwave
    res.status(200).send("Webhook processed successfully");

  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Error processing Flutterwave bank transfer webhook:", error);
    // Send 500 to indicate an error on your side, Flutterwave might retry.
    // However, if the error is due to bad data that won't change, a 200 might be better to stop retries.
    // This depends on the nature of the error.
    res.status(500).send("Internal server error processing webhook");
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}














module.exports = {
  handleCreditUserWallet,
  handlePaymentHistory,
  handleCreditWalletFromBank,
  handlePaymentCallback,
  handleFlutterwaveBankTransferWebhook
};
