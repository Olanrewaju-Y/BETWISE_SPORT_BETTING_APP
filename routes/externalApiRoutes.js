const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config(); 



//  RAPID_API
router.get('/rapid-api-events', async (req, res) => {
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



// the sports db
router.get('/sports-db-events', async (req, res) => {
  try {
    const options = {
      method: 'GET',
      url: "https://www.thesportsdb.com/api/v1/json/123/search_all_teams.php?l=English_Premier_League"
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error('SportsDb Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from SportsDb' });
  }
});






module.exports = router;
