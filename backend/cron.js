const mongoose = require('mongoose');
const File = require('./models/File');
const ShareLink = require('./models/ShareLink');
const fs = require('fs');
const cron = require('node-cron');
const { connectDatabase } = require('./config/database');

/**
 * Cleanup Expired Files
 * Deletes files that have no active share links or all share links are expired
 */
const cleanupExpiredFiles = async () => {
    try {
        console.log('🧹 Running cleanup job for expired files...');

        // Find files that are marked as deleted
        const deletedFiles = await File.find({ isDeleted: true });

        if (deletedFiles.length > 0) {
            console.log(`🗑️ Found ${deletedFiles.length} deleted files. Removing...`);

            for (const file of deletedFiles) {
                // Delete from disk
                if (fs.existsSync(file.path)) {
                    try {
                        fs.unlinkSync(file.path);
                        console.log(`   Deleted file: ${file.originalName} (${file._id})`);
                    } catch (err) {
                        console.error(`   ❌ Error deleting file ${file.path}:`, err.message);
                    }
                }

                // Delete from DB
                await File.findByIdAndDelete(file._id);
            }
        }

        // Find orphaned files (files with no active share links)
        const allFiles = await File.find({ isDeleted: { $ne: true } });
        let orphanedCount = 0;

        for (const file of allFiles) {
            const activeLinks = await ShareLink.countDocuments({
                fileId: file._id,
                isActive: true
            });

            if (activeLinks === 0) {
                // No active share links, mark for deletion
                file.isDeleted = true;
                file.deletedAt = new Date();
                await file.save();
                orphanedCount++;
                console.log(`   Marked orphaned file for deletion: ${file.originalName}`);
            }
        }

        if (orphanedCount > 0) {
            console.log(`📦 Marked ${orphanedCount} orphaned files for deletion`);
        }

        console.log('✅ File cleanup complete.');

    } catch (error) {
        console.error('❌ File Cleanup Job Error:', error);
    }
};

/**
 * Cleanup Expired Share Links
 * Deactivates share links that have expired
 */
const cleanupExpiredShareLinks = async () => {
    try {
        console.log('🔗 Running cleanup job for expired share links...');

        const expiredLinks = await ShareLink.find({
            isActive: true,
            expiresAt: { $lt: new Date() }
        });

        if (expiredLinks.length === 0) {
            console.log('✨ No expired share links found.');
            return;
        }

        console.log(`🗑️ Found ${expiredLinks.length} expired share links. Deactivating...`);

        for (const link of expiredLinks) {
            link.isActive = false;
            link.deactivatedAt = new Date();
            link.deactivationReason = 'expired';
            await link.save();
            console.log(`   Deactivated link: ${link.token}`);
        }

        console.log('✅ Share link cleanup complete.');

    } catch (error) {
        console.error('❌ Share Link Cleanup Job Error:', error);
    }
};

/**
 * Run All Cleanup Tasks
 */
const runCleanup = async () => {
    console.log('\n🕰️ === CLEANUP JOB STARTED ===');
    console.log(`Time: ${new Date().toISOString()}`);

    await cleanupExpiredShareLinks();
    await cleanupExpiredFiles();

    console.log('=== CLEANUP JOB COMPLETED ===\n');
};

/**
 * Start Cron Job
 * Schedule is configurable via environment variable
 */
const startCleanupJob = () => {
    // Default: Run every hour at minute 0
    const schedule = process.env.CLEANUP_CRON_SCHEDULE || '0 * * * *';

    cron.schedule(schedule, runCleanup);
    console.log(`🕰️ Cleanup job scheduled: ${schedule}`);

    // Run immediately on startup
    setTimeout(runCleanup, 5000); // Wait 5 seconds for DB connection
};

module.exports = {
    startCleanupJob,
    runCleanup, // Export for manual run if needed
    cleanupExpiredFiles,
    cleanupExpiredShareLinks
};

