const mongoose = require("mongoose");
const User = require("./userModel")

// Assuming your User model is defined elsewhere and named 'User'
// e.g., const User = require('./UserModel'); // Or however you import it

const leagueSchema = new mongoose.Schema({
  id: { type: String, trim: true },
  name: { type: String, trim: true },
  country: { type: String, trim: true },
}, { _id: false });

const venueSchema = new mongoose.Schema({
  id: { type: String, trim: true },
  name: { type: String, trim: true, required: true },
  city: { type: String, trim: true },
  capacity: { type: Number },
  imageUrl: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid image URL'] },
}, { _id: false });

const logosSchema = new mongoose.Schema({
  primary: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid primary logo URL'] },
  icon: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid icon URL'] },
}, { _id: false });

const kitColorsSchema = new mongoose.Schema({
    jersey: { type: String, trim: true, match: [/^#([0-9A-Fa-f]{3,4}){1,2}$/, 'Please fill a valid hex color'] },
    shorts: { type: String, trim: true, match: [/^#([0-9A-Fa-f]{3,4}){1,2}$/, 'Please fill a valid hex color'] },
    socks: { type: String, trim: true, match: [/^#([0-9A-Fa-f]{3,4}){1,2}$/, 'Please fill a valid hex color'] },
}, { _id: false });

const teamColorsSchema = new mongoose.Schema({
  primary: { type: String, trim: true, match: [/^#([0-9A-Fa-f]{3,4}){1,2}$/, 'Please fill a valid hex color'] },
  secondary: { type: String, trim: true, match: [/^#([0-9A-Fa-f]{3,4}){1,2}$/, 'Please fill a valid hex color'] },
  accent: { type: String, trim: true, match: [/^#([0-9A-Fa-f]{3,4}){1,2}$/, 'Please fill a valid hex color'] },
  kitHome: kitColorsSchema,
  kitAway: kitColorsSchema,
  kitThird: kitColorsSchema,
}, { _id: false });

const kitImagesSchema = new mongoose.Schema({
  home: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid home kit image URL'] },
  away: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid away kit image URL'] },
  third: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid third kit image URL'] },
}, { _id: false });

const standingSchema = new mongoose.Schema({
  leagueId: { type: String, trim: true },
  position: { type: Number },
  points: { type: Number },
  gamesPlayed: { type: Number },
  wins: { type: Number },
  draws: { type: Number },
  losses: { type: Number },
  goalDifference: { type: Number },
}, { _id: false });

const trophySchema = new mongoose.Schema({
  competitionId: { type: String, trim: true },
  name: { type: String, trim: true, required: true },
  count: { type: Number, required: true },
  yearsWon: [{ type: Number }],
}, { _id: false });

const socialMediaSchema = new mongoose.Schema({
  twitter: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid Twitter URL'] },
  instagram: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid Instagram URL'] },
  facebook: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid Facebook URL'] },
  youtube: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid YouTube URL'] },
  tiktok: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid TikTok URL'] },
}, { _id: false });

const teamSchema = new mongoose.Schema({
//   teamApiId: { type: String, trim: true, unique: true, sparse: true },
  officialName: { type: String, trim: true, required: [true, "Official team name is required."] },
  commonName: { type: String, trim: true, required: [true, "Common team name is required."] },
  shortName: { type: String, trim: true, uppercase: true },
  sport: { type: String, trim: true, required: [true, "Sport type is required."] },
  league: leagueSchema,
  country: { type: String, trim: true, required: [true, "Country is required."] },
  city: { type: String, trim: true },
  founded: { type: Number, min: 1800, max: new Date().getFullYear() + 1 },

  venue: venueSchema,

  logos: logosSchema,
  teamColors: teamColorsSchema,
  kitImages: kitImagesSchema,

  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This 'User' must match the name used in mongoose.model('User', userSchema)
                 // It's recommended to ensure this User has a 'manager' role at the application level.
  },
  squad: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This 'User' must match the name used in mongoose.model('User', userSchema)
                 // It's recommended to ensure these Users have a 'player' role at the application level.
  }],

  currentStanding: standingSchema,
  recentForm: [{ type: String, trim: true, enum: ["W", "D", "L", "P", "N/A"] }],
  trophies: [trophySchema],

  officialWebsiteUrl: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid website URL'] },
  socialMediaLinks: socialMediaSchema,
  officialShopUrl: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid shop URL'] },
  ticketingUrl: { type: String, trim: true, match: [/^https?:\/\/.+\..+/, 'Please fill a valid ticketing URL'] },

  dataSource: { type: String, trim: true },
}, { timestamps: true });

teamSchema.index({ commonName: 1 });
teamSchema.index({ shortName: 1 });
teamSchema.index({ "league.name": 1 });
teamSchema.index({ country: 1 });

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;






// const teamProfile = {
//   // --- Basic Information ---
//   officialName: "Real Madrid Club de Fútbol",
//   commonName: "Real Madrid",
//   shortName: "RMA", // Common abbreviation or ticker
//   sport: "Football", // e.g., "Football", "Basketball", "Ice Hockey"
//   league: {
//     id: "LIGA_ESP_01",
//     name: "La Liga",
//     country: "Spain"
//   },
//   country: "Spain",
//   city: "Madrid",
//   founded: 1902, // Year of foundation

//   // --- Venue / Stadium Information ---
//   venue: {
//     id: "STAD_001",
//     name: "Santiago Bernabéu Stadium",
//     city: "Madrid",
//     capacity: 81044,
//     imageUrl: "https://example.com/stadiums/santiago_bernabeu_exterior.jpg"
//   },

//   // --- Visual Identity ---
//   logos: {
//     primary: "https://img.uefa.com/imgml/TP/teams/logos/240x240/50051.png", // Main logo
//     icon: "https://example.com/logos/real_madrid_icon_small.png" // Small icon for favicons or lists
//   },
//   teamColors: {
//     primary: "#FFFFFF",   // Hex code for primary color (e.g., White)
//     secondary: "#FEBE10", // Hex code for secondary color (e.g., Gold/Yellow)
//     accent: "#00529F",    // Hex code for accent color (e.g., Blue)
//     kitHome: {
//         jersey: "#FFFFFF",
//         shorts: "#FFFFFF",
//         socks: "#FFFFFF"
//     },
//     kitAway: { // Example for away kit colors
//         jersey: "#5D2E8C",
//         shorts: "#5D2E8C",
//         socks: "#5D2E8C"
//     }
//   },
//   kitImages: { // URLs to images of the team's kits
//     home: "https://example.com/kits/real_madrid_23_24_home.jpg",
//     away: "https://example.com/kits/real_madrid_23_24_away.jpg",
//     third: "https://example.com/kits/real_madrid_23_24_third.jpg"
//   },

//   // --- Personnel (can be dynamic) ---
//   manager: {
//     id: "MGR_007",
//     name: "Carlo Ancelotti", // This changes, so ideally linked by ID
//     nationality: "Italian",
//     phone: null
//   },

//   squad: [
//     { playerId: "PLAYER_RM_001", name: "Jude Bellingham", position: "Midfielder", jerseyNumber: 5 },
//     { playerId: "PLAYER_RM_002", name: "Vinícius Júnior", position: "Forward", jerseyNumber: 7 },
//     // ... more players
//   ],

//   // --- Performance & History (can be dynamic or historical snapshots) ---
//   currentStanding: { 
//     leagueId: "LIGA_ESP_01",
//     position: 1,
//     points: 70,
//     gamesPlayed: 28,
//     wins: 22,
//     draws: 4,
//     losses: 2,
//     goalDifference: 45
//   },
//   recentForm: ["W", "W", "D", "W", "L"], // e.g., Last 5 official matches (W=Win, D=Draw, L=Loss)
//   trophies: [ // A list of major achievements
//     {
//       competitionId: "UEFA_CL_01",
//       name: "UEFA Champions League",
//       count: 14,
//       yearsWon: [1956, 1957, 1958, 1959, 1960, 1966, 1998, 2000, 2002, 2014, 2016, 2017, 2018, 2022]
//     },
//     {
//       competitionId: "LIGA_ESP_01",
//       name: "La Liga",
//       count: 35, // Example count
//       // yearsWon: [...]
//     }
  
//   ],
//   // --- Online Presence & Links ---
//   officialWebsiteUrl: "https://www.realmadrid.com/",
//   socialMediaLinks: {
//     twitter: "https://twitter.com/realmadrid",
//     instagram: "https://www.instagram.com/realmadrid/",
//     facebook: "https://www.facebook.com/RealMadrid/",
//     youtube: "https://www.youtube.com/user/realmadridcf",
//     tiktok: "https://www.tiktok.com/@realmadrid"
//   },
//   officialShopUrl: "https://shop.realmadrid.com/",
//   ticketingUrl: "https://www.realmadrid.com/en/tickets",

// };
