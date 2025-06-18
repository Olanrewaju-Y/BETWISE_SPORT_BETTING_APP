const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const {
  sendForgetPasswordEmail,
  generateAccessToken,
  generateRefreshToken,
  REFRESH_SECRET
} = require("../services/server");
const { MIN_BET_AMOUNT, MIN_TOPUP_AMOUNT } = require("../config/server");






// AUTH ROLES

const handleUserSignUp = async (req, res) => {
  const {
    email,
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
    const user = await User.findOne({ email: email });

    if (user) {
      res.status(400).json({
        message: "email already exists, try login",
      });
      console.log("Registration failed: email already exists");
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
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
        email: newUser.email,
        age: newUser.age,
        walletBalance: newUser.walletBalance,
        nickName: newUser.nickName,
        role: newUser.role,
        gender: newUser.gender,
        phoneNo: newUser.phoneNo,
        country: newUser.country,
        interests: newUser.interests,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
    console.log("User created successfully:", newUser.email);
  } catch (error) {
    console.error("Error in handleUserSignUp:", error);
    res.status(500).json({ message: error.message });
  }
};

const handleUserLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({
        message: "Incorrect email or password",
      });
      console.log(
        `Login attempt failed for email: ${email} (user not found)`
      );
      return;
    }
    // decoding the password
    const passwordMatch = await bcrypt.compare(
      password,
      user?.password
    );
    if (!passwordMatch) {
      res.status(400).json({
        message: "Incorrect password or email",
      });
      console.log(
        `Login attempt failed for email: ${email} (incorrect password)`
      );
      return;
    }

    // Generate tokens using service functions
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken
    await user.save()

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge:  30 * 24 * 60 * 60 * 1000, // 30days
    }).json({ message: "User logged in successfully",
      user: {
        email: user?.email,
        age: user?.age,
        walletBalance: user?.walletBalance,
        nickName: user?.nickName,
        role: user?.role,
        gender: user?.gender,
        country: user?.country,
        interests: user?.interests,
        userId: user?._id,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      },
      accessToken,
      refreshToken,
      })    
    console.log("User logged in successfully:", user.email);
  } catch (error) {
    console.error("Error in handleUserLogin:", error);
    res.status(500).json({ message: error.message });
  }
};

const handleRefresh = async (req, res) => {
  const token = req.cookies.jwt
  if(!token) return res.sendStatus(401)
  
    try{
      const payload = jwt.verify(token, REFRESH_SECRET)
      const user = await User.findById( payload.id )

      if( !user || user.refreshToken !== token ) {
        return sendStatus(403)
      }
      
      const newAccessToken = generateAccessToken( user )
      res.status(200).json({ accessToken: newAccessToken })
    } catch(err) {
      return res.sendStatus(403);
    }
  }

const handleLogOut = async (req, res) => {
  const token = req.cookies.jwt
  if(!token) return res.sendStatus(204)

    const user = await User.findOne({ refreshToken: token })
    if (user) {
      user.refreshToken = null
      await user.save()
    }
   res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict"
    })
   res.sendStatus(204)
}

const handleForgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email });

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
    console.log("Password reset successfully for user:", user.email);
  } catch (error) {
    console.error("Error in handleResetPassword:", error);
    res.status(500).json({ message: error.message });
  }
};












module.exports = {
  handleUserSignUp,
  handleUserLogin,
  handleForgetPassword,
  handleResetPassword,
  handleRefresh,
  handleLogOut
};
