const socketIO = require('socket.io');

let io;

exports.init = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
    });

    // Middleware for authentication (optional for now)
    // io.use((socket, next) => { ... });

    io.on('connection', (socket) => {
        // console.log(`Socket connected: ${socket.id}`);

        socket.on('join_room', (room) => {
            socket.join(room);
            // console.log(`User joined room: ${room}`);
        });

        socket.on('leave_room', (room) => {
            socket.leave(room);
        });

        socket.on('disconnect', () => {
            // console.log('Socket disconnected');
        });
    });

    // Namespaces
    const telemetryNs = io.of('/telemetry');
    telemetryNs.on('connection', (socket) => {
        // Client subscribes to specific flight updates
        socket.on('subscribe_flight', (flightId) => {
            socket.join(`flight_${flightId}`);
        });
    });

    const chatNs = io.of('/chat');
    chatNs.on('connection', (socket) => {
        // Nabız Sohbet logic
        socket.on('join_chat', (roomId) => {
            socket.join(roomId);
        });

        socket.on('send_message', (data) => {
            // Broadcast to room (excluding sender)
            socket.to(data.roomId).emit('new_message', data);
        });
    });

    console.log('✅ Socket.io initialized');
    return io;
};

exports.getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
