const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// --- Configuration ---

// In a real application, this would come from a database, configuration file, or an API.
// Using placeholder image URLs. Replace with actual logo URLs.
const TEAM_LOGOS = {
    "TeamA": "https://via.placeholder.com/150/007bff/FFFFFF?Text=TeamA", // Blue background
    "TeamB": "https://via.placeholder.com/150/dc3545/FFFFFF?Text=TeamB", // Red background
    "TeamC": "https://via.placeholder.com/150/28a745/FFFFFF?Text=TeamC", // Green background
    "TeamD": "https://via.placeholder.com/150/ffc107/000000?Text=TeamD", // Yellow background
    // Add more teams and their logo URLs here
};

const DEFAULT_LOGO_SIZE = { width: 150, height: 150 };
const TEXT_COLOR_HEX = "#000000"; // Black
const BACKGROUND_RGBA = { r: 255, g: 255, b: 255, alpha: 1 }; // White, fully opaque
const OUTPUT_DIR = path.join(__dirname, 'event_mockups_nodejs'); // Output directory
const DEFAULT_FONT_SIZE_PX = 40;
const FONT_FAMILY = 'Arial, Sans-Serif'; // Common fallback fonts
// const FONT_PATH = '/path/to/your/font.ttf'; // Optional: path to a specific .ttf or .otf file

// --- Helper Function: Generate Event Mockup ---

async function _fetchImageBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
        return Buffer.from(response.data);
    } catch (error) {
        console.error(`Failed to fetch image from ${url}: ${error.message}`);
        return null;
    }
}

async function generateEventMockup(homeTeamName, awayTeamName) {
    try {
        const homeLogoUrl = TEAM_LOGOS[homeTeamName];
        const awayLogoUrl = TEAM_LOGOS[awayTeamName];

        if (!homeLogoUrl) {
            console.error(`Error: Logo URL for home team '${homeTeamName}' not found.`);
            return null;
        }
        if (!awayLogoUrl) {
            console.error(`Error: Logo URL for away team '${awayTeamName}' not found.`);
            return null;
        }

        // Fetch logo image buffers
        const homeLogoBuffer = await _fetchImageBuffer(homeLogoUrl);
        const awayLogoBuffer = await _fetchImageBuffer(awayLogoUrl);

        if (!homeLogoBuffer) {
            console.error(`Error: Could not fetch logo for home team '${homeTeamName}'.`);
            return null;
        }
        if (!awayLogoBuffer) {
            console.error(`Error: Could not fetch logo for away team '${awayTeamName}'.`);
            return null;
        }

        // Resize logos
        const resizedHomeLogoBuffer = await sharp(homeLogoBuffer)
            .resize(DEFAULT_LOGO_SIZE.width, DEFAULT_LOGO_SIZE.height, {
                fit: 'contain', // Scales down to fit, preserves aspect ratio
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background for the resize op
            })
            .png() // Ensure PNG to handle potential transparency from original or resize
            .toBuffer();

        const resizedAwayLogoBuffer = await sharp(awayLogoBuffer)
            .resize(DEFAULT_LOGO_SIZE.width, DEFAULT_LOGO_SIZE.height, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();

        // Prepare text image ("Vs")
        const vsText = "Vs";
        const textSvg = `
            <svg width="200" height="100">
                <style>
                    .title { 
                        fill: ${TEXT_COLOR_HEX}; 
                        font-size: ${DEFAULT_FONT_SIZE_PX}px; 
                        font-family: ${FONT_FAMILY};
                        dominant-baseline: middle;
                        text-anchor: middle;
                    }
                </style>
                <text x="50%" y="50%" class="title">${vsText}</text>
            </svg>`;
        const vsTextBuffer = Buffer.from(textSvg);
        const vsTextSharp = sharp(vsTextBuffer);
        const vsTextMetadata = await vsTextSharp.metadata();
        const textWidth = vsTextMetadata.width;
        const textHeight = vsTextMetadata.height;


        // Define layout
        const padding = 20;
        const spaceBetweenLogosAndText = Math.max(50, textWidth + 10); // Space for text + some breathing room

        const canvasWidth = (DEFAULT_LOGO_SIZE.width * 2) + spaceBetweenLogosAndText + (padding * 2);
        const canvasHeight = Math.max(DEFAULT_LOGO_SIZE.height, textHeight) + (padding * 2);

        // Create canvas
        const canvas = sharp({
            create: {
                width: canvasWidth,
                height: canvasHeight,
                channels: 4, // RGBA
                background: BACKGROUND_RGBA
            }
        });

        // Composite images
        const homeLogoX = padding;
        const homeLogoY = Math.floor((canvasHeight - DEFAULT_LOGO_SIZE.height) / 2);

        const textX = homeLogoX + DEFAULT_LOGO_SIZE.width + Math.floor((spaceBetweenLogosAndText - textWidth) / 2);
        const textY = Math.floor((canvasHeight - textHeight) / 2);

        const awayLogoX = textX + textWidth + Math.floor((spaceBetweenLogosAndText - textWidth) / 2);
        const awayLogoY = Math.floor((canvasHeight - DEFAULT_LOGO_SIZE.height) / 2);

        canvas.composite([
            { input: resizedHomeLogoBuffer, top: homeLogoY, left: homeLogoX },
            { input: vsTextBuffer, top: textY, left: textX, blend: 'over' }, // Use 'over' for SVG with transparency
            { input: resizedAwayLogoBuffer, top: awayLogoY, left: awayLogoX }
        ]);

        // Ensure output directory exists
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Save image
        const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
        const filename = `${homeTeamName}_vs_${awayTeamName}_${timestamp}.png`;
        const outputPath = path.join(OUTPUT_DIR, filename);

        await canvas.png().toFile(outputPath); // Save as PNG
        console.log(`Mockup image saved to: ${outputPath}`);
        return outputPath;

    } catch (error) {
        console.error(`An unexpected error occurred in generateEventMockup: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
        return null;
    }
}



module.exports = {
    generateEventMockup,
};








