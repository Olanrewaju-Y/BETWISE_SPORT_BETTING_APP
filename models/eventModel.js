const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",       
        required: true
    },
    eventType: {
        type: String,
        required: true,
        enum: [ "football", "cricket", "basket ball", "tennis" ],
        default: ""
    },
    eventDescription: {
        type: String,
        required: true
    },
    eventImage: {
        type: String,
        required: true
    },
    homeTeam: {
        type: String,
        required: true,
        default: "home"
    },
    homeTeamScore: {
        type: Number,
        default: 0
    },
    awayTeam: {
        type: String,
        required: true,
        default: "away"
    },
     awayTeamScore: {
        type: Number,
        default: 0
    },
    availableOdds: {
        type: { 
            "1x2": { 
                homeTeamWinPoint: Number, // or "1"
                drawPoint: Number,        // or "x"
                awayTeamWinPoint: Number  // or "2"
            },
            doubleChance: { "1x": Number, "12": Number, "x2": Number },
            overUnder: { "over2_5": Number, "under2_5": Number },
            ggNg: { "gg": Number, "ng": Number } 
        },
        default: () => ({ // Default to an empty object or a pre-filled structure
            "1x2": { 
                homeTeamWinPoint: null, 
                drawPoint: null, 
                awayTeamWinPoint: null 
            },
            doubleChance: { "1x": null, "12": null, "x2": null },
            overUnder: { "over2_5": null, "under2_5": null },
            ggNg: { "gg": null, "ng": null }
        })
    },
    eventStatus: {
        type: String,
        required: true,
        enum: [ "upcoming", "ongoing", "completed", "cancelled", "suspended", "ended", "expired", "deleted", "archived" ],
        default: "upcoming" 
    },
    eventReviews: {
        type: String,
        default: ""
    },
    eventDate: {
        type: Date,
        required: true
    },
    eventTime: {
        type: String,
        required: true
    }
}, 

{timestamps: true}

);

// Helper function to check if a market's odds are all null (i.e., default and not manually set)
function marketIsDefault(market) {
    if (!market) return true; // If market object doesn't exist, consider it default
    return Object.values(market).every(value => value === null);
}

eventSchema.pre('save', function(next) {
    // This hook will run before saving a new event or when event.save() is called.
    // It checks if 1x2 odds are provided and then calculates other odds if they haven't been manually set.

    if (this.availableOdds && this.availableOdds['1x2']) {
        const oneXTwo = this.availableOdds['1x2'];
        const homeWinOdd = oneXTwo.homeTeamWinPoint;
        const drawOdd = oneXTwo.drawPoint;
        const awayWinOdd = oneXTwo.awayTeamWinPoint;

        // Ensure we have valid 1x2 odds to calculate from
        if (typeof homeWinOdd === 'number' && homeWinOdd > 0 &&
            typeof drawOdd === 'number' && drawOdd > 0 &&
            typeof awayWinOdd === 'number' && awayWinOdd > 0) {

            // --- Calculate Double Chance ---
            // Only calculate if doubleChance is in its default state (all nulls) or not provided
            if (marketIsDefault(this.availableOdds.doubleChance)) {
                const probHome = 1 / homeWinOdd;
                const probDraw = 1 / drawOdd;
                const probAway = 1 / awayWinOdd;

                const prob1X = probHome + probDraw;
                const prob12 = probHome + probAway;
                const probX2 = probDraw + probAway;

                this.availableOdds.doubleChance = {
                    '1x': prob1X > 0 ? parseFloat((1 / prob1X).toFixed(2)) : null,
                    '12': prob12 > 0 ? parseFloat((1 / prob12).toFixed(2)) : null,
                    'x2': probX2 > 0 ? parseFloat((1 / probX2).toFixed(2)) : null,
                };
            }

            // --- Simplistic Placeholder for Over/Under 2.5 ---
            // WARNING: This is a very naive calculation and not standard bookmaking practice.
            // It's provided as a placeholder for automation as requested.
            if (marketIsDefault(this.availableOdds.overUnder)) {
                let over2_5_odd, under2_5_odd;
                // Example heuristic: If one team is a strong favorite or draw odds are high (suggesting an open game)
                if (Math.min(homeWinOdd, awayWinOdd) < 1.5 || drawOdd > 3.5) {
                    over2_5_odd = 1.75; under2_5_odd = 2.05; // Higher chance of over
                } else if (drawOdd < 2.8) { // Low draw odds might suggest a tighter game, fewer goals
                    over2_5_odd = 2.10; under2_5_odd = 1.70; // Higher chance of under
                } else { // Default balanced odds
                    over2_5_odd = 1.90; under2_5_odd = 1.90;
                }
                this.availableOdds.overUnder = {
                    'over2_5': over2_5_odd,
                    'under2_5': under2_5_odd,
                };
            }

            // --- Simplistic Placeholder for GG/NG (Both Teams to Score) ---
            // WARNING: This is a very naive calculation and not standard bookmaking practice.
            if (marketIsDefault(this.availableOdds.ggNg)) {
                let gg_odd, ng_odd;
                // Example heuristic: If odds are close and not extremely low (suggesting both teams might score)
                if (Math.abs(homeWinOdd - awayWinOdd) < 0.5 && homeWinOdd > 1.8 && awayWinOdd > 1.8 && drawOdd > 3.0) {
                    gg_odd = 1.70; ng_odd = 2.10; // Higher chance of GG
                } else if (drawOdd < 2.5 || Math.min(homeWinOdd, awayWinOdd) < 1.3) { // Strong favorite or very likely low-scoring draw
                    gg_odd = 2.00; ng_odd = 1.80; // Higher chance of NG
                } else { // Default balanced odds
                    gg_odd = 1.85; ng_odd = 1.85;
                }
                this.availableOdds.ggNg = { 'gg': gg_odd, 'ng': ng_odd };
            }
        }
    }
    next();
});

const Event = mongoose.model("Event", eventSchema)

module.exports = Event
