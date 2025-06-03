const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const {
  sendForgetPasswordEmail,
  generateAccessToken,
  generateRefreshToken,
} = require("../services/server");
const { MIN_BET_AMOUNT, MIN_TOPUP_AMOUNT } = require("../config/server");






// AUTH ROLES

const handleUserSignUp = async (req, res) => {
  const {
    userName,
    password,
    age,
    nickName,
    role,
    gender,
    phoneNo, // Destructure phoneNo from req.body
    country,
    interests,
  } = req.body;

  try {
    if (age < 18) {
      res.status(400).json({
        message: "User must be 18 or above to register",
      });
      console.log("Registration failed: User < 18");
      return;
    }
    const existingUser = await User.findOne({ userName: userName });

    if (existingUser) {
      res.status(400).json({
        message: "UserName already exists, try login",
      });
      console.log("Registration failed: UserName already exists");
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userName,
      password: hashedPassword,
      age,
      // walletBalance is intentionally omitted here to rely on the schema default of 0
      nickName,
      role,
      gender,
      phoneNo, // Pass phoneNo to the User constructor
      country,
      interests,
    });

    await newUser.save();

    res.status(200).json({
      message: "User created successfully",
      user: {
        userName: newUser.userName,
        age: newUser.age,
        walletBalance: newUser.walletBalance,
        nickName: newUser.nickName,
        role: newUser.role,
        gender: newUser.gender,
        country: newUser.country,
        interests: newUser.interests,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
    console.log("User created successfully:", newUser.userName);
  } catch (error) {
    console.error("Error in handleUserSignUp:", error);
    res.status(500).json({ message: error.message });
  }
};

const handleUserLogin = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingUser = await User.findOne({ userName });

    if (!existingUser) {
      res.status(400).json({
        message: "Incorrect username or password",
      });
      console.log(
        `Login attempt failed for username: ${userName} (user not found)`
      );
      return;
    }
    // decoding the password
    const passwordMatch = await bcrypt.compare(
      password,
      existingUser?.password
    );
    if (!passwordMatch) {
      res.status(400).json({
        message: "Incorrect password or username",
      });
      console.log(
        `Login attempt failed for username: ${userName} (incorrect password)`
      );
      return;
    }

    // Generate tokens using service functions
    const accessToken = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    res.status(200).json({
      message: "User logged in successfully",
      user: {
        userName: existingUser?.userName,
        age: existingUser?.age,
        walletBalance: existingUser?.walletBalance,
        nickName: existingUser?.nickName,
        role: existingUser?.role,
        gender: existingUser?.gender,
        country: existingUser?.country,
        interests: existingUser?.interests,
        userId: existingUser?._id,
        createdAt: existingUser?.createdAt,
        updatedAt: existingUser?.updatedAt,
      },
      accessToken,
      refreshToken, // Send refresh token to the client if needed
    });
    console.log("User logged in successfully:", existingUser.userName);
  } catch (error) {
    console.error("Error in handleUserLogin:", error);
    res.status(500).json({ message: error.message });
  }
};

const handleForgetPassword = async (req, res) => {
  const { userName } = req.body;

  try {
    const user = await User.findOne({ userName: userName });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate access token for password reset
    const token = generateAccessToken(user);

    // Send the password reset email
    await sendForgetPasswordEmail(user, token);

    res.status(200).json({
      message: "Email sent successfully, pls check provided email",
    });
  } catch (error) {
    console.error("Error in handleForgetPassword:", error);
    res.status(500).json({ message: error.message });
  }
};

const handleResetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
    });
    console.log("Password reset successfully for user:", user.userName);
  } catch (error) {
    console.error("Error in handleResetPassword:", error);
    res.status(500).json({ message: error.message });
  }
};










module.exports = {
  handleUserSignUp,
  handleUserLogin,
  handleForgetPassword,
  handleResetPassword
};
