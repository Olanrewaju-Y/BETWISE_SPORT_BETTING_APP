const express = require("express");
const router = express.Router();


const { authenticateToken, validateIsAdmin } = require("../middlewares/server");



// View and play games







module.exports = router