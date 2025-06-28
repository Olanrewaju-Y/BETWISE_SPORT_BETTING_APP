const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config(); 




router.get('/', async (req, res) => {
  try {
    // Validate env vars
    const { RAPID_API_URL, RAPID_API_KEY, RAPID_API_HOST_URL } = process.env;

    if (!RAPID_API_URL || !RAPID_API_KEY || !RAPID_API_HOST_URL) {
      return res.status(500).json({ error: 'Missing RapidAPI environment variables' });
    }

    const options = {
      method: 'GET',
      url: RAPID_API_URL,
      params: {fixture: '215662'},
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': RAPID_API_HOST_URL
      }
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error('RapidAPI Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from RapidAPI' });
  }
});



module.exports = router;
