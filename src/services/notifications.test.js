import { notificationToMessage, messagePreview } from "./notifications";

const incomingText = {
    typeWebhook: "incomingMessageReceived",
    idMessage: "ABC123",
    timestamp: 1738451680,
    senderData: { chatId: "79001234567@c.us", senderName: "Alex" },
    messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "Hello" } },
};

test("converts an incoming text notification into a chat message", () => {
    expect(notificationToMessage(incomingText)).toEqual({
        idMessage: "ABC123",
        chatId: "79001234567@c.us",
        type: "incoming",
        typeMessage: "textMessage",
        textMessage: "Hello",
        senderName: "Alex",
        timestamp: 1738451680,
    });
});

test("marks messages sent from the phone or API as outgoing", () => {
    const body = { ...incomingText, typeWebhook: "outgoingAPIMessageReceived" };
    expect(notificationToMessage(body).type).toBe("outgoing");
});

test("maps file messages to the URL field MessageList expects", () => {
    const body = {
        ...incomingText,
        messageData: {
            typeMessage: "imageMessage",
            fileMessageData: { downloadUrl: "https://example.com/a.jpg", caption: "" },
        },
    };
    const message = notificationToMessage(body);
    expect(message.imageUrl).toBe("https://example.com/a.jpg");
    expect(messagePreview(message)).toBe("Photo");
});

test("ignores notifications that are not chat messages", () => {
    expect(notificationToMessage(null)).toBeNull();
    expect(notificationToMessage({ typeWebhook: "stateInstanceChanged" })).toBeNull();
    expect(notificationToMessage({ typeWebhook: "incomingMessageReceived" })).toBeNull();
});
