// Importing all dependencies
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();



// Import your new router
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const externalApiRoutes = require("./routes/externalApiRoutes")
// const aiRoutes = require("./routes/aiRoutes")



// middleware / body parser
app.use(express.json());


// ALLOW CORS MIDDLEWARE
const allowedOrigins = [process.env.FRONTEND_APP_URL];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));


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
app.get("/", (req, res) => { res.status(200).json({ message: "Welcome To BetWise!" }); });

// Route for External API events
app.use("/api/live-events", externalApiRoutes );

// Mount the authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/payment", paymentRoutes);
// app.use("/api/ai", aiRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack trace for debugging
  res.status(500).send({ error: 'Something went wrong!' });
});

//Consider adding 404 handler
app.use((req, res, next) => {
  res.status(404).send({ error: 'Not Found' });
});




