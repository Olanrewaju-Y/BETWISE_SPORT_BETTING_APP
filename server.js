// Importing all dependencies
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
// Import your new router
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const paymentRoutes = require("./routes/paymentRoutes");



// middle ware / body parser
app.use(express.json());

// setting up PORT
const PORT = process.env.PORT || 8000;

// Setting up Mongoose for MongoDB
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


// APIs

// Test/Welcome Page 
app.get("/", (req, res) => { res.status(200).json({ message: "Welcome To BetWise!" }) })


// Mount the authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/payment", paymentRoutes);

