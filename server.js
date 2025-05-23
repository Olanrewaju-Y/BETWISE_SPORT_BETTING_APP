// Importing all dependencies

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./models/userModel");
const Event = require("./models/eventModel");
const Bet = require("./models/betModel");
const Payment = require("./models/paymentModel");
const { handleUserSignUp, handleUserLogin, handleAdminCreateEvent } = require("./controllers/server");
const { authenticateToken } = require("./middlewares/server");

// middle ware / body parser
app.use(express.json());

// setting up PORT
const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    // CONNECT TO MONGODB
    console.log("Connected to MongoDB");

    // CONNECT TO SERVER
    app.listen(PORT, () => {
      console.log(`Server listening on PORT ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB", error);
    process.exit(1);
  });







// SETTING APIs

// Sign - up API AND ENDPOINT
app.post("/signup", handleUserSignUp);

// LOGIN API AND ENDPOINT
app.post("/login", handleUserLogin)

// ADMIN POST GAMES API AND ENDPOINT 
app.post("/create-event", authenticateToken, handleAdminCreateEvent);