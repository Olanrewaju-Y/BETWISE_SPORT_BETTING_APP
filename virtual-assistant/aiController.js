require("dotenv").config();
const express = require("express");
const axios = require("axios");
const {OpenAI} = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})



// // Virtual assistant USING OPENAI
// const handleAiVirtualAssistant = async (req, res) => {
//   const userMessage = req.body.message;
//   try {
//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {role: "system", content: "You are doing well."},
//         {role: "user", content: "userMessage"}
//       ]
//     });

//     const reply = completion.choices[0].message.content;
//     res.json({ reply })

//     // OR USING AXIOS

//     // const response = await axios.post(
//     //   "https://api.openai.com/v1/chat/completions",
//     //   {
//     //     model: "gpt-3.5-turbo",
//     //     messages: [{ role: "user", content: userMessage }],
//     //   },
//     //   {
//     //     headers: {
//     //       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     //       "Content-Type": "application/json",
//     //     },
//     //   }
//     // );
//     // const assistantMessage = response.data.choices[0].message.content;
//     // res.json({ response: assistantMessage });
//   } catch (error) {
//     console.error(error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to connect to AI service." });
//   }
// };





module.exports = handleAiVirtualAssistant;