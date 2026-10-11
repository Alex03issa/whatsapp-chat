// Helpers for GREEN-API notifications (the same payload arrives through
// ReceiveNotification polling and through the optional webhook server).

const MESSAGE_WEBHOOK_TYPES = {
    incomingMessageReceived: "incoming",
    outgoingMessageReceived: "outgoing",
    outgoingAPIMessageReceived: "outgoing",
};

const FILE_URL_FIELDS = {
    imageMessage: "imageUrl",
    audioMessage: "audioUrl",
    videoMessage: "videoUrl",
    documentMessage: "documentUrl",
};

/**
 * Convert a notification body into the message shape used by MessageList.
 * Returns null for notifications that are not chat messages (status updates, etc.).
 */
export const notificationToMessage = (body) => {
    if (!body) return null;

    const type = MESSAGE_WEBHOOK_TYPES[body.typeWebhook];
    const chatId = body.senderData?.chatId;
    if (!type || !chatId) return null;

    const data = body.messageData || {};
    const typeMessage = data.typeMessage || "unknown";

    const message = {
        idMessage: body.idMessage,
        chatId,
        type,
        typeMessage,
        textMessage:
            data.textMessageData?.textMessage ??
            data.extendedTextMessageData?.text ??
            data.fileMessageData?.caption ??
            "",
        senderName: body.senderData?.senderName,
        timestamp: body.timestamp,
    };

    const urlField = FILE_URL_FIELDS[typeMessage];
    if (urlField && data.fileMessageData?.downloadUrl) {
        message[urlField] = data.fileMessageData.downloadUrl;
    }

    return message;
};

/** Short preview text for the chat list. */
export const messagePreview = (message) => {
    if (!message) return "";
    if (message.textMessage) return message.textMessage;

    const labels = {
        imageMessage: "Photo",
        audioMessage: "Voice message",
        videoMessage: "Video",
        documentMessage: "Document",
    };
    return labels[message.typeMessage] || "Message";
};
