const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const Filter = require("bad-words");
const {
    generateMessage,
    generateLocationMessage,
} = require("./utils/messages");
const {
    addUser,
    getUser,
    getUsersInRoom,
    removeUser,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
    console.log(`New user connected`);

    socket.on("join", ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit("message", generateMessage("Admin", "Welcome!"));
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                generateMessage("Admin",`${user.username} has joined the chat !`)
            );

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room),
        });
        callback();
    });

    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback("Profanity not allowed!");
        }

        const user = getUser(socket.id);
        io.to(user.room).emit(
            "message",
            generateMessage(user.username, message)
        );
        callback();
    });

    socket.on("sendLocation", ({ long, lat }, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit(
            "locationMessage",
            generateLocationMessage(
                user.username,
                `https://google.com/maps?q=${lat},${long}`
            )
        );
        callback();
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit(
                "message",
                generateMessage("Admin", `${user.username} has left`)
            );
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}, http://localhost:${port}`);
});
