const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();
const jwt = require('jsonwebtoken');
const User = require("../models/userModel");



// Generate ACCESS token
const generateAccessToken = ( user ) => { // Renamed parameter for clarity
const accessToken = jwt.sign(
        { id: user._id }, // Use user._id
        process.env.ACCESS_TOKEN,
        { expiresIn: "5m" }
      )
      return accessToken;
}

// Generate REFRESH token
const generateRefreshToken = ( user ) => { // Renamed parameter for clarity
const refreshToken = jwt.sign(
        { id: user._id }, // Use user._id
        process.env.REFRESH_TOKEN,
        { expiresIn: "30d" }
      )

return refreshToken;
}

// send Forget Password Email
const sendForgetPasswordEmail = async (user, token) => { 
   
    try {
        const mailTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        })

        const mailDetails = {
            from: process.env.EMAIL, 
            to: user.userName,
            subject: "Password Reset Notification",
            html: `
            <hi>Password Reset Notification</h1>

            Here is the token to reset your password please click on the button below,
            <br>
            <br>            
            <button type="button"> <a class"" href='https://www.betwise.com/reset-password/${token}'>Reset Password </a></button>
            <br>
            <br>
            <br>
                if the button does not work for any reason, please click the link below

                <a href='https://www.betwise.com/reset-password/${token}.'>Reset Password </a>
            <br>
            <br>
            <br>
            ${token}
            `
        }
       await mailTransporter.sendMail(mailDetails)
   } catch (error) {
    console.log(error);
   }
}








module.exports = {
    generateAccessToken,
    generateRefreshToken,
    sendForgetPasswordEmail
}
