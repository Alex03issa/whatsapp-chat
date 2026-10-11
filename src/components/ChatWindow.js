import React, { useState, useEffect, useRef, useCallback } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { sendMessage, getChatHistory, getContactInfo } from "../services/api";
import "./ChatWindow.css";

const HISTORY_PAGE_SIZE = 50;
const bgImage = "/assets/whatsapp-bg-lgt.jpg";

const scrollToBottom = (listRef, smooth = true) => {
    setTimeout(() => {
        const list = listRef.current;
        if (list) list.scrollTo({ top: list.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    }, 100);
};

const avatarFallback = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

/**
 * Shows one chat: its history, new messages and the input box.
 *
 * New messages are not polled here. Home owns the single notification loop and
 * calls the handler this component registers with `subscribe(chatId, handler)`.
 */
const ChatWindow = ({ chat, credentials, subscribe }) => {
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [contactName, setContactName] = useState(chat.id);
    const [contactAvatar, setContactAvatar] = useState("");

    const messageListRef = useRef(null);
    const messageIds = useRef(new Set()); // ids already shown, to avoid duplicates
    const loadingHistoryRef = useRef(false); // synchronous guard for scroll events
    const historyCountRef = useRef(HISTORY_PAGE_SIZE);

    const idInstance = credentials?.idInstance;
    const apiTokenInstance = credentials?.apiTokenInstance;
    const chatId = chat.id;

    /** Add a message to the open chat, ignoring duplicates and other chats. */
    const addNewMessage = useCallback((newMessage) => {
        if (newMessage.chatId !== chatId) return;
        if (newMessage.idMessage && messageIds.current.has(newMessage.idMessage)) return;

        if (newMessage.idMessage) messageIds.current.add(newMessage.idMessage);
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom(messageListRef);
    }, [chatId]);

    // Load contact info and history whenever the open chat changes, and listen
    // for new messages of this chat. Everything is cleaned up on chat change.
    useEffect(() => {
        if (!idInstance || !apiTokenInstance) return undefined;

        let cancelled = false;

        setMessages([]);
        setHasMoreHistory(true);
        setContactName(chatId);
        setContactAvatar("");
        messageIds.current = new Set();
        historyCountRef.current = HISTORY_PAGE_SIZE;

        getContactInfo(idInstance, apiTokenInstance, chatId)
            .then((info) => {
                if (cancelled || !info) return;
                setContactName(info.name || info.contactName || chatId);
                setContactAvatar(info.avatar || "");
            })
            .catch((error) => console.error("Error fetching contact info:", error.message));

        getChatHistory(idInstance, apiTokenInstance, chatId, HISTORY_PAGE_SIZE)
            .then((history) => {
                if (cancelled || !Array.isArray(history)) return;
                const own = history
                    .filter((msg) => msg.chatId === chatId)
                    .sort((a, b) => a.timestamp - b.timestamp);

                // Keep messages that arrived while the history was loading.
                setMessages((live) => {
                    const liveIds = new Set(live.map((m) => m.idMessage));
                    const merged = [...own.filter((m) => !liveIds.has(m.idMessage)), ...live];
                    merged.forEach((m) => messageIds.current.add(m.idMessage));
                    return merged;
                });
                if (history.length < HISTORY_PAGE_SIZE) setHasMoreHistory(false);
                scrollToBottom(messageListRef, false);
            })
            .catch((error) => console.error("Error fetching chat history:", error.message));

        const unsubscribe = subscribe ? subscribe(chatId, addNewMessage) : () => {};

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [chatId, idInstance, apiTokenInstance, subscribe, addNewMessage]);

    /** Load older messages when the list is scrolled to the top. */
    const loadOlderMessages = async () => {
        if (!hasMoreHistory || loadingHistoryRef.current) return;

        loadingHistoryRef.current = true;
        setLoadingHistory(true);

        try {
            // getChatHistory returns the newest `count` messages, so ask for more each time.
            const count = historyCountRef.current + HISTORY_PAGE_SIZE;
            const history = await getChatHistory(idInstance, apiTokenInstance, chatId, count);
            historyCountRef.current = count;

            const older = (Array.isArray(history) ? history : [])
                .filter((msg) => msg.chatId === chatId && !messageIds.current.has(msg.idMessage));

            if (!Array.isArray(history) || history.length < count) setHasMoreHistory(false);

            if (older.length > 0) {
                older.forEach((msg) => messageIds.current.add(msg.idMessage));
                setMessages((prev) => [...older, ...prev]);
            }
        } catch (error) {
            console.error("Error fetching older messages:", error.message);
        } finally {
            loadingHistoryRef.current = false;
            setLoadingHistory(false);
        }
    };

    /** Send a text message. */
    const handleSendMessage = async (message) => {
        if (!message.trim()) return;

        const response = await sendMessage(idInstance, apiTokenInstance, chatId, message);
        if (!response) return;

        addNewMessage({
            textMessage: message,
            typeMessage: "textMessage",
            type: "outgoing",
            chatId,
            timestamp: Math.floor(Date.now() / 1000),
            // Use GREEN-API's id so the outgoing notification for it is not shown twice.
            idMessage: response.idMessage || `sent-${Date.now()}`,
        });
    };

    if (!idInstance || !apiTokenInstance) {
        return <p>Please log in first.</p>;
    }

    return (
        <div
            className="chat-window"
            style={{ background: `url(${bgImage}) center/cover no-repeat` }}
        >
            <div className="chat-header">
                <div className="chat-avatar">
                    <img
                        src={contactAvatar || avatarFallback(contactName)}
                        alt="Avatar"
                        onError={(e) => { e.target.src = avatarFallback(contactName); }}
                    />
                    <h3>{contactName}</h3>
                </div>
            </div>

            <div
                className="message-list-container"
                ref={messageListRef}
                onScroll={(e) => {
                    if (e.target.scrollTop === 0) {
                        loadOlderMessages();
                    }
                }}
            >
                {loadingHistory && <p className="loading">Loading older messages...</p>}
                <MessageList messages={messages} credentials={credentials} />
            </div>

            <MessageInput onSendMessage={handleSendMessage} />
        </div>
    );
};

export default ChatWindow;
