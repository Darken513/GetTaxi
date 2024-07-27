const { io } = require("../server");

// Define a map to store rooms (rideId => { clients: [], drivers: [] })
exports.rooms = new Map();
exports.io = io;

exports.initSocketSystem = () => {
    io.on('connection', (socket) => {
        socket.on('joinRoom', (message) => {
            let room = exports.rooms.get(message.rideId);
            if (!room) {
                room = {};
                exports.rooms.set(message.rideId, room);
            };
            if (message.isDriver) {
                room.driver = socket.id;
            } else {
                room.client = socket.id;
            }
        });
        socket.on('canceledRide', (message) => {
            let room = exports.rooms.get(message.rideId);
            if (!room) {
                return;
            };
            if (message.isDriver) {
                if (!room.client)
                    return;
                io.to(room.client).emit('canceledRide', { reason: 'todo' });
            } else {
                if (!room.driver)
                    return;
                io.to(room.driver).emit('canceledRide', { reason: 'todo' });
            }
        });
        socket.on('driverUpdate', (message) => {
            let room = exports.rooms.get(message.rideId);
            if (!room || !room.client) {
                return;
            };
            io.to(room.client).emit('driverUpdate', message);
        });
        socket.on('clientUpdate', (message) => {
            let room = exports.rooms.get(message.rideId);
            if (!room || !room.driver) {
                return;
            };
            io.to(room.driver).emit('clientUpdate', message);
        });
        socket.on('clientHeartBeat', (message) => {
            let room = exports.rooms.get(message.rideId);
            if (!room || !room.driver) {
                return;
            };
            io.to(room.driver).emit('clientHeartBeat', message);
        });
        socket.on('reachedClient', (message) => {
            let room = exports.rooms.get(message.rideId);
            if (!room || !room.client) {
                return;
            };
            io.to(room.client).emit('reachedClient', message);
        });
        socket.on('rideEnded', (message) => {
            let room = exports.rooms.get(message.rideId);
            if (!room || !room.client) {
                return;
            };
            io.to(room.client).emit('rideEnded', message);
        });
    });
}