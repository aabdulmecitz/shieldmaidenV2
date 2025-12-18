const http = require('http');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const socketManager = require('./socket');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const startServer = async () => {
    try {
        // 1. Initialize Socket.io
        socketManager.init(server);

        // 2. Start Server
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Server ${PORT} portunda çalışıyor.`);
            console.log(`🌐 API: http://0.0.0.0:${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI ? 'Set ✅' : 'Not set ❌'}`);
        });

        // 3. Connect to Database
        const dbConnection = await connectDatabase();
        if (!dbConnection) {
            console.warn('⚠️ MongoDB bağlantısı kurulamadı, ancak sunucu çalışmaya devam ediyor.');
        }
    } catch (error) {
        console.error('❌ Server başlatma hatası:', error);
        process.exit(1);
    }
};

startServer();
