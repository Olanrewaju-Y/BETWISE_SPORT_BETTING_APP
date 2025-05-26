const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require("dotenv").config();



//  validate Register
const validateRegister = (req, res, next) => {
  const {
    userName,
    password,
    below18,
    walletBalance,
    nickName,
    role,
    gender,
    country,
    interests,
  } = req.body;

  const errors = []

  if (!userName) {
    errors.push("Please add your email");
  }
  if (!password) {
    errors.push("Please add your Password");
  }

  if(errors.length > 0){
        return res.status(400).json({message: errors})
    }

  next();
};

// validate Email Format
const validateEmailFormat = (req, res, next) => {
  const {
    userName,
    password,
    below18,
    walletBalance,
    nickName,
    role,
    gender,
    country,
    interests,
  } = req.body;

  const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailFormat.test(userName)) {
    res.status(400).json({
      message: "Invalid email format",
    });

    return console.log("Invalid email format request was recieved");
  }

  const passwordFormat =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
 
  if (!passwordFormat.test(password)) {
    res.status(400).json({
      message: "Invalid password format",
    });

    return console.log("Invalid password format request was recieved");
  }

  next();
};

// Authentication
const authenticateToken = async (req, res, next) => {

  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null)
    return res.status(401).json({ message: "No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN); // verify the header token with inhouse using jwt

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(403).json({ message: "User not found for token." });
    }
    req.user = user; // Attach user to request object (req.user.id, req.user.role, etc.)

    next();

  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

// validate if user is Admin
const validateIsAdmin = (req, res, next) => {
    const adminUser = req.user;

      if (adminUser.role !== "admin") {
      return res.status(403).json({
        message: "User is not authorized. Admin privileges required.",
      });
      }
    next()
}




module.exports = {
  validateRegister,
  validateEmailFormat,
  authenticateToken,
  validateIsAdmin
};
