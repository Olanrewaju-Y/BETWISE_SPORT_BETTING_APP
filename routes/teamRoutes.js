const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken, validateIsvalidateIsAdmin } = require("../middlewares/server");

router.route('/')
  .post(authenticateToken, validateIsAdmin, teamController.createTeam) // Assuming validateIsAdmin access for creation
  .get(teamController.getAllTeams);

router.route('/:id')
  .get(teamController.getTeamById)
  .put(authenticateToken, validateIsAdmin, teamController.updateTeam)
  .delete(authenticateToken, validateIsAdmin, teamController.deleteTeam);

router.route('/:teamId/manager')
  .put(authenticateToken, validateIsAdmin, teamController.assignManagerToTeam)
  .get(teamController.getTeamManager);

router.route('/:teamId/squad')
  .post(authenticateToken, validateIsAdmin, teamController.addPlayerToSquad) // Or team manager access
  .get(teamController.getTeamSquad);

router.route('/:teamId/squad/:playerId')
  .delete(authenticateToken, validateIsAdmin, teamController.removePlayerFromSquad); // Or team manager access

module.exports = router;

