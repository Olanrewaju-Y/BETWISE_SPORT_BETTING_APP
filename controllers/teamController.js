const mongoose = require('mongoose');
const Team = require('../models/teamModel'); 
const User = require('../models/userModel'); 

// Helper function for error responses
const handleError = (res, error, statusCode = 500, message = "Server error") => {
    console.error(error);
    // Check for Mongoose validation errors
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(el => el.message);
        return res.status(400).json({ message: "Validation Error", errors });
    }
    // Check for Mongoose CastError (e.g., invalid ObjectId)
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: "Invalid ID format." });
    }
    // Check for duplicate key errors (e.g., unique constraint violation)
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(409).json({ message: `Duplicate value for ${field}. Please use another value.` });
    }
    return res.status(statusCode).json({ message, error: error.message });
};

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Private (Admin)
 */
exports.createTeam = async (req, res) => {
    try {
        const {
            officialName, commonName, shortName, sport, league, country, city, founded,
            venue, logos, teamColors, kitImages, manager, squad, currentStanding,
            recentForm, trophies, officialWebsiteUrl, socialMediaLinks,
            officialShopUrl, ticketingUrl, dataSource, teamApiId
        } = req.body;

        // Basic validation (Mongoose schema will do more)
        if (!officialName || !commonName || !sport || !country) {
            return res.status(400).json({ message: "Official name, common name, sport, and country are required." });
        }

        // Optional: Validate if manager and squad members (User ObjectIds) exist and have correct roles
        // This would involve querying the User model. For brevity, we'll assume valid IDs are passed.
        // Example check for manager:
        // if (manager) {
        //   const managerUser = await User.findById(manager);
        //   if (!managerUser || managerUser.role !== 'manager') {
        //     return res.status(400).json({ message: "Invalid manager ID or user is not a manager." });
        //   }
        // }

        const newTeam = new Team({
            officialName, commonName, shortName, sport, league, country, city, founded,
            venue, logos, teamColors, kitImages, manager, squad, currentStanding,
            recentForm, trophies, officialWebsiteUrl, socialMediaLinks,
            officialShopUrl, ticketingUrl, dataSource, teamApiId
        });

        const savedTeam = await newTeam.save();
        res.status(201).json({ message: "Team created successfully", team: savedTeam });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * @desc    Get all teams with pagination, filtering, and sorting
 * @route   GET /api/teams
 * @access  Public
 */
exports.getAllTeams = async (req, res) => {
    try {
        const { page = 1, limit = 10, sport, country, leagueName, sortBy, sortOrder = 'asc', populate = '' } = req.query;

        const query = {};
        if (sport) query.sport = sport;
        if (country) query.country = country;
        if (leagueName) query['league.name'] = new RegExp(leagueName, 'i'); // Case-insensitive search

        const sortOptions = {};
        if (sortBy) sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        else sortOptions.commonName = 1; // Default sort

        const teams = await Team.find(query)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort(sortOptions)
            .populate(populate.includes('manager') ? { path: 'manager', select: 'name email role' } : '')
            .populate(populate.includes('squad') ? { path: 'squad', select: 'name email role position' } : ''); // Adjust fields as needed

        const totalTeams = await Team.countDocuments(query);

        res.status(200).json({
            message: "Teams fetched successfully",
            teams,
            totalPages: Math.ceil(totalTeams / limit),
            currentPage: parseInt(page),
            totalTeams
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * @desc    Get a single team by ID
 * @route   GET /api/teams/:id
 * @access  Public
 */
exports.getTeamById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid team ID format." });
        }

        const team = await Team.findById(req.params.id)
            .populate({ path: 'manager', select: 'name email role' }) // Populate manager details
            .populate({ path: 'squad', select: 'name email role position jerseyNumber' }); // Populate squad details

        if (!team) {
            return res.status(404).json({ message: "Team not found." });
        }
        res.status(200).json({ message: "Team fetched successfully", team });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * @desc    Update a team by ID
 * @route   PUT /api/teams/:id
 * @access  Private (Admin)
 */
exports.updateTeam = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid team ID format." });
        }

        // Optional: If manager or squad IDs are being updated, validate them
        // if (req.body.manager) { ... validate manager ... }
        // if (req.body.squad) { ... validate squad members ... }

        const updatedTeam = await Team.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // Return the updated document and run schema validators
        )
        .populate({ path: 'manager', select: 'name email role' })
        .populate({ path: 'squad', select: 'name email role position jerseyNumber' });

        if (!updatedTeam) {
            return res.status(404).json({ message: "Team not found." });
        }
        res.status(200).json({ message: "Team updated successfully", team: updatedTeam });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * @desc    Delete a team by ID
 * @route   DELETE /api/teams/:id
 * @access  Private (Admin)
 */
exports.deleteTeam = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid team ID format." });
        }

        const deletedTeam = await Team.findByIdAndDelete(req.params.id);

        if (!deletedTeam) {
            return res.status(404).json({ message: "Team not found." });
        }
        res.status(200).json({ message: "Team deleted successfully", teamId: req.params.id });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * @desc    Assign a manager to a team
 * @route   PUT /api/teams/:teamId/manager
 * @access  Private (Admin)
 */
exports.assignManagerToTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { managerId } = req.body; // Expecting managerId (which is a User ObjectId)

        if (!mongoose.Types.ObjectId.isValid(teamId) || (managerId && !mongoose.Types.ObjectId.isValid(managerId))) {
            return res.status(400).json({ message: "Invalid team ID or manager ID format." });
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: "Team not found." });
        }

        if (managerId) {
            const managerUser = await User.findById(managerId);
            if (!managerUser) {
                return res.status(404).json({ message: "Manager (User) not found." });
            }
            // Application-level role check (example)
            if (managerUser.role !== 'manager') { // Assuming User model has a 'role' field
                return res.status(400).json({ message: "Specified user is not a manager." });
            }
            team.manager = managerId;
        } else {
            // If managerId is null or not provided, unassign the manager
            team.manager = null;
        }

        const updatedTeam = await team.save();
        await updatedTeam.populate({ path: 'manager', select: 'name email role' });

        res.status(200).json({ message: "Manager assigned/updated successfully", team: updatedTeam });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * @desc    Add a player to a team's squad
 * @route   POST /api/teams/:teamId/squad
 * @access  Private (Admin or Team Manager)
 */
exports.addPlayerToSquad = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { playerId } = req.body; // Expecting playerId (which is a User ObjectId)

        if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(playerId)) {
            return res.status(400).json({ message: "Invalid team ID or player ID format." });
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: "Team not found." });
        }

        const playerUser = await User.findById(playerId);
        if (!playerUser) {
            return res.status(404).json({ message: "Player (User) not found." });
        }
        // Application-level role check (example)
        if (playerUser.role !== 'player') { // Assuming User model has a 'role' field
            return res.status(400).json({ message: "Specified user is not a player." });
        }

        // Check if player is already in the squad
        if (team.squad.includes(playerId)) {
            return res.status(400).json({ message: "Player already in squad." });
        }

        team.squad.push(playerId);
        const updatedTeam = await team.save();
        await updatedTeam.populate({ path: 'squad', select: 'name email role position jerseyNumber' });

        res.status(200).json({ message: "Player added to squad successfully", team: updatedTeam });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * @desc    Remove a player from a team's squad
 * @route   DELETE /api/teams/:teamId/squad/:playerId
 * @access  Private (Admin or Team Manager)
 */
exports.removePlayerFromSquad = async (req, res) => {
    try {
        const { teamId, playerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(playerId)) {
            return res.status(400).json({ message: "Invalid team ID or player ID format." });
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: "Team not found." });
        }

        // Check if player exists in the squad before trying to remove
        const playerIndex = team.squad.indexOf(playerId);
        if (playerIndex === -1) {
            return res.status(404).json({ message: "Player not found in squad." });
        }

        team.squad.pull(playerId); // Mongoose .pull() removes the item from the array
        const updatedTeam = await team.save();
        await updatedTeam.populate({ path: 'squad', select: 'name email role position jerseyNumber' });

        res.status(200).json({ message: "Player removed from squad successfully", team: updatedTeam });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * @desc    Get a team's squad
 * @route   GET /api/teams/:teamId/squad
 * @access  Public
 */
exports.getTeamSquad = async (req, res) => {
    try {
        const { teamId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: "Invalid team ID format." });
        }

        const team = await Team.findById(teamId)
            .select('squad commonName officialName') // Select only squad and team names
            .populate({
                path: 'squad',
                select: 'name email role position jerseyNumber profileImage' // Customize fields as needed from User model
            });

        if (!team) {
            return res.status(404).json({ message: "Team not found." });
        }

        res.status(200).json({
            message: "Team squad fetched successfully",
            teamName: team.commonName || team.officialName,
            squad: team.squad
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * @desc    Get a team's manager
 * @route   GET /api/teams/:teamId/manager
 * @access  Public
 */
exports.getTeamManager = async (req, res) => {
    try {
        const { teamId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: "Invalid team ID format." });
        }

        const team = await Team.findById(teamId)
            .select('manager commonName officialName') // Select only manager and team names
            .populate({
                path: 'manager',
                select: 'name email role profileImage' // Customize fields as needed from User model
            });

        if (!team) {
            return res.status(404).json({ message: "Team not found." });
        }

        if (!team.manager) {
            return res.status(404).json({ message: "Team does not have a manager assigned." });
        }

        res.status(200).json({
            message: "Team manager fetched successfully",
            teamName: team.commonName || team.officialName,
            manager: team.manager
        });
    } catch (error) {
        handleError(res, error);
    }
};

