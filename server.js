// Optional webhook relay.
//
// GREEN-API can POST notifications to a webhook URL instead of the browser
// polling ReceiveNotification. This server receives them on POST /webhook and
// pushes them to the React app over socket.io. Start it with `npm run server`
// and start the app with REACT_APP_WEBHOOK_SOCKET_URL=http://localhost:5000.
// For GREEN-API to reach it, expose it publicly (for example with a tunnel)
// and set that URL as the webhook URL in the instance settings.
//
// Demo only: the webhook is not authenticated. Set WEBHOOK_TOKEN and the same
// value as the "webhookUrlToken" in GREEN-API to require it in the
// Authorization header.

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;

const app = express();
app.use(express.json());
app.use(cors({ origin: CLIENT_ORIGIN }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST"]
    }
});

const MESSAGE_WEBHOOKS = new Set([
    "incomingMessageReceived",
    "outgoingMessageReceived",
    "outgoingAPIMessageReceived"
]);

app.post("/webhook", (req, res) => {
    const auth = req.get("Authorization") || "";
    if (WEBHOOK_TOKEN && auth !== `Bearer ${WEBHOOK_TOKEN}` && auth !== WEBHOOK_TOKEN) {
        return res.sendStatus(401);
    }

    const notification = req.body;

    if (MESSAGE_WEBHOOKS.has(notification?.typeWebhook)) {
        io.emit("newMessage", notification);
    }

    res.sendStatus(200);
});

server.listen(PORT, () => {
    console.log(`Webhook relay listening on port ${PORT}`);
});
