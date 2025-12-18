const fs = require('fs');
const path = require('path');

const filesToRemove = [
    "backend/controllers/birdController.js",
    "backend/controllers/observationController.js",
    "backend/controllers/swipeController.js",
    "backend/controllers/identificationController.js",
    "backend/controllers/matchController.js",
    "backend/controllers/articleController.js",
    "backend/models/Bird.js",
    "backend/models/Observation.js",
    "backend/models/Swipe.js",
    "backend/models/Identification.js",
    "backend/models/Article.js",
    "backend/models/Board.js",
    "backend/docker-compose.dev.yml",
    "backend/COOLIFY_SETUP.md",
    "backend/TESTING.md"
];

console.log("Starting cleanup...");

filesToRemove.forEach(file => {
    // Current working directory is passed by the agent, so we resolve from there
    // The agent usually runs from the root of the workspace
    const fullPath = path.resolve(process.cwd(), file);

    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Deleted: ${file}`);
        } else {
            console.log(`⚠️ Not found (already deleted): ${file}`);
        }
    } catch (err) {
        console.error(`❌ Error deleting ${file}: ${err.message}`);
    }
});

console.log("Cleanup finished.");
