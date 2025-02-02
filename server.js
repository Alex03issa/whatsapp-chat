const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"]
    }
});

// Webhook endpoint to receive messages
app.post("/webhook", (req, res) => {
    const incomingMessage = req.body;

    console.log("Received message:", incomingMessage);

    if (incomingMessage.typeWebhook === "incomingMessageReceived") {
        io.emit("newMessage", incomingMessage);
    }

    res.sendStatus(200); // Acknowledge receipt of webhook
});

// Start the server
server.listen(5000, () => {
    console.log("🚀 Server is running on port 5000");
});
