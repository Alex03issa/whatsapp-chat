import React, { useState, useEffect, useRef } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import {
    sendMessage,
    receiveMessages, 
    deleteNotification,
    getChatHistory,
    getContactInfo
} from "../services/api"; 
import "./ChatWindow.css";

const ChatWindow = ({ chat, credentials }) => {
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [contactName, setContactName] = useState(chat.id);
    const [contactAvatar, setContactAvatar] = useState("");
    const [isFetchingNew, setIsFetchingNew] = useState(false); // Prevent multiple API calls

    const messageListRef = useRef(null);
    const messageIds = useRef(new Set()); // Prevent duplicate messages
    const bgImage = "/assets/whatsapp-bg-lgt.jpg";

    useEffect(() => {
        if (credentials?.idInstance && credentials?.apiTokenInstance && chat) {
            fetchContactInfo();
            fetchMessages();
            startRealTimeFetching();

            // Fetch new messages via HTTP API (Polling)
            const interval = setInterval(fetchNewMessages, 5000); // Poll every 5 seconds

            return () => {
                clearInterval(interval);
            };
        }
    }, [chat.id, credentials]); // Only update when chat changes

    if (!credentials || !credentials.idInstance || !credentials.apiTokenInstance) {
        console.warn("No credentials found, redirecting to login...");
        return <p>Please log in first.</p>;
    }

    /** Fetch Contact Info (Name + Avatar) */
    const fetchContactInfo = async () => {
        try {
            const contactInfo = await getContactInfo(credentials.idInstance, credentials.apiTokenInstance, chat.id);
            if (contactInfo) {
                setContactName(contactInfo.name || contactInfo.contactName || chat.id);
                setContactAvatar(contactInfo.avatar || "");
            }
        } catch (error) {
            console.error(" Error fetching contact info:", error);
        }
    };

    const startRealTimeFetching = async () => {
        while (true) {
            await fetchNewMessages();
            await new Promise(resolve => setTimeout(resolve, 2000)); 
        }
    };

    /** Fetch Messages ONLY for Selected Chat */
    const fetchMessages = async () => {
        if (!credentials.idInstance || !credentials.apiTokenInstance || !chat.id) return;

        try {
            console.log(`Fetching messages for chat: ${chat.id}`);
            const chatHistory = await getChatHistory(credentials.idInstance, credentials.apiTokenInstance, chat.id, 50);

            const filteredHistory = chatHistory
                ? chatHistory
                    .filter(msg => msg.chatId === chat.id && !messageIds.current.has(msg.idMessage)) // Filter chat messages
                    .sort((a, b) => a.timestamp - b.timestamp)
                : [];

            filteredHistory.forEach(msg => messageIds.current.add(msg.idMessage));
            setMessages(filteredHistory);

            // Scroll to bottom on first load
            setTimeout(() => {
                if (messageListRef.current) {
                    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
                }
            }, 100);
        } catch (error) {
            console.error(" Error fetching messages:", error);
        }
    };

    /** Fetch New Incoming Messages via HTTP API */
    const fetchNewMessages = async () => {
        if (isFetchingNew) return;
        setIsFetchingNew(true);
    
        try {
            console.log("🔍 Checking for new messages via HTTP API...");
            
            // Step 1: Get the notification from the API
            const newNotification = await receiveMessages(credentials.idInstance, credentials.apiTokenInstance);
            
            if (!newNotification || !newNotification.body) {
                setIsFetchingNew(false);
                return;
            }
    
            console.log("Received Notification:", newNotification);
    
            const { receiptId, body } = newNotification; // Extract receiptId and message body
    
            // Step 2: Validate if it's an incoming message for the active chat
            if (body.typeWebhook === "incomingMessageReceived" && body.senderData?.chatId === chat.id) {
                addNewMessage({
                    textMessage: body.messageData?.textMessageData?.textMessage || "",
                    typeMessage: body.messageData?.typeMessage || "unknown",
                    type: "incoming",
                    chatId: body.senderData.chatId,
                    senderName: body.senderData.senderName,
                    timestamp: body.timestamp,
                    idMessage: body.idMessage
                });
    
                console.log("New message added to chat:", body.messageData?.textMessageData?.textMessage);
            }
    
            // Step 3: Delete the processed notification to allow new messages
            await deleteNotification(credentials.idInstance, credentials.apiTokenInstance, receiptId);
            console.log("Deleted processed notification:", receiptId);
    
        } catch (error) {
            console.error(" Error fetching new messages:", error);
        }
    
        setIsFetchingNew(false);
    };
    

    /** Load Older Messages (Only One Call Per Scroll) */
    const loadOlderMessages = async () => {
        if (!hasMoreHistory || loadingHistory) return;

        setLoadingHistory(true);
        console.log("Loading older messages...");

        try {
            const olderMessages = await getChatHistory(
                credentials.idInstance,
                credentials.apiTokenInstance,
                chat.id,
                50
            );

            if (!olderMessages || olderMessages.length === 0) {
                setHasMoreHistory(false);
                return;
            }

            olderMessages
                .filter(msg => msg.chatId === chat.id && !messageIds.current.has(msg.idMessage)) // Filter only this chat
                .forEach(msg => messageIds.current.add(msg.idMessage));

            setMessages(prevMessages => [...olderMessages, ...prevMessages]);

            console.log("Older messages loaded:", olderMessages.length);
        } catch (error) {
            console.error(" Error fetching older messages:", error);
        }

        setLoadingHistory(false);
    };

    /** Handle Sending Message via HTTP API */
    const handleSendMessage = async (message) => {
        if (!message.trim()) return;

        try {
            const response = await sendMessage(credentials.idInstance, credentials.apiTokenInstance, chat.id, message);

            if (response) {
                console.log("Message sent successfully:", response);
                const sentMessage = {
                    textMessage: message,
                    typeMessage: "textMessage",
                    type: "outgoing",
                    chatId: chat.id,
                    timestamp: Math.floor(Date.now() / 1000),
                    idMessage: `sent-${Date.now()}`
                };

                addNewMessage(sentMessage);

                // Scroll to bottom after sending message
                setTimeout(() => {
                    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
                }, 100);
            }
        } catch (error) {
            console.error(" Error sending message:", error);
        }
    };

    /** Add New Message to Chat (Prevents Duplicates) */
    const addNewMessage = (newMessage) => {
        if (newMessage.chatId !== chat.id) return; // Ensure only current chat messages are added

        if (!messageIds.current.has(newMessage.idMessage)) {
            messageIds.current.add(newMessage.idMessage);
            setMessages(prevMessages => [...prevMessages, newMessage]);

            //Scroll to bottom when a new message arrives
            setTimeout(() => {
                messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
            }, 100);
        }
    };

    return (
        <div 
            className="chat-window" 
            style={{ background: `url(${bgImage}) center/cover no-repeat` }}
        >
            <div className="chat-header">
                <div className="chat-avatar">
                    <img 
                        src={contactAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random`} 
                        alt="Avatar" 
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random`; }} 
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

// this code using webhook

/**
import React, { useState, useEffect, useRef } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import {
    sendMessage,
    getLastIncomingMessages,
    getChatHistory,
    getContactInfo
} from "../services/api";
import { io } from "socket.io-client";
import "./ChatWindow.css";

// Connect to WebSocket server
const socket = io("http://localhost:5000", {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

const ChatWindow = ({ chat, credentials }) => {
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [contactName, setContactName] = useState(chat.id);
    const [contactAvatar, setContactAvatar] = useState("");
    const [isFetching, setIsFetching] = useState(false); // Prevent multiple API calls

    const messageListRef = useRef(null);
    const messageIds = useRef(new Set()); // Prevent duplicate messages

    useEffect(() => {
        if (credentials?.idInstance && credentials?.apiTokenInstance && chat) {
            setHasMoreHistory(true);
            fetchContactInfo();
            fetchMessages();

            // Set up WebSocket listener
            socket.on("newMessage", (newMessage) => {
                console.log("New message received via WebSocket:", newMessage);

                if (newMessage.senderData.chatId === chat.id) {
                    addNewMessage({
                        textMessage: newMessage.messageData?.textMessageData?.textMessage || "",
                        type: newMessage.messageData?.typeMessage || "unknown",
                        chatId: newMessage.senderData.chatId,
                        senderName: newMessage.senderData.senderName,
                        timestamp: newMessage.timestamp,
                        idMessage: newMessage.idMessage
                    });
                }
            });

            // Fetch new messages **only if WebSocket fails**
            const interval = setInterval(fetchNewMessages, 5000); 

            return () => {
                clearInterval(interval);
                socket.off("newMessage");
            };
        }
    }, [chat.id, credentials]);

    if (!credentials || !credentials.idInstance || !credentials.apiTokenInstance) {
        console.warn("No credentials found, redirecting to login...");
        return <p>Please log in first.</p>;
    }

    //Fetch Contact Info (Name + Avatar)
    const fetchContactInfo = async () => {
        try {
            const contactInfo = await getContactInfo(credentials.idInstance, credentials.apiTokenInstance, chat.id);
            if (contactInfo) {
                setContactName(contactInfo.name || contactInfo.contactName || chat.id);
                setContactAvatar(contactInfo.avatar || "");
            }
        } catch (error) {
            console.error("Error fetching contact info:", error);
        }
    };

    // Fetch All Messages (Load Latest Messages First)
    const fetchMessages = async () => {
        if (!credentials.idInstance || !credentials.apiTokenInstance || !chat.id) return;

        try {
            console.log("Fetching messages...");
            const chatHistory = await getChatHistory(credentials.idInstance, credentials.apiTokenInstance, chat.id, 50);

            const filteredHistory = chatHistory
                ? chatHistory
                    .filter(msg => msg.chatId === chat.id && !messageIds.current.has(msg.idMessage)) // Prevent duplicates
                    .sort((a, b) => b.timestamp - a.timestamp) // Load newest messages first
                : [];

            filteredHistory.forEach(msg => messageIds.current.add(msg.idMessage));

            setMessages(filteredHistory);

            // Scroll to **bottom first** to show the latest message
            setTimeout(() => {
                if (messageListRef.current) {
                    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
                }
            }, 100);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    //Fetch New Incoming Messages (Prevent API Overload) 
    const fetchNewMessages = async () => {
        if (isFetching) return; // Prevent duplicate calls
        setIsFetching(true);

        try {
            console.log("Checking for new messages...");
            const newIncomingMessages = await getLastIncomingMessages(
                credentials.idInstance,
                credentials.apiTokenInstance
            );

            if (!newIncomingMessages || newIncomingMessages.length === 0) return;

            const filteredNewMessages = newIncomingMessages
                .filter(msg => msg.chatId === chat.id && !messageIds.current.has(msg.idMessage))
                .sort((a, b) => b.timestamp - a.timestamp); // Show newest first

            filteredNewMessages.forEach(addNewMessage);
        } catch (error) {
            console.error("Error fetching new messages:", error);
        }

        setIsFetching(false);
    };

    // Load Older Messages (One Call Per Scroll Up)
    const loadOlderMessages = async () => {
        if (!hasMoreHistory || loadingHistory) return;

        setLoadingHistory(true);
        console.log("🔄 Loading older messages...");

        try {
            const olderMessages = await getChatHistory(
                credentials.idInstance,
                credentials.apiTokenInstance,
                chat.id,
                50
            );

            if (!olderMessages || olderMessages.length === 0) {
                setHasMoreHistory(false);
                return;
            }

            const filteredOlderMessages = olderMessages
                .filter(msg => msg.chatId === chat.id && !messageIds.current.has(msg.idMessage))
                .sort((a, b) => a.timestamp - b.timestamp); // Keep older messages at the top

            filteredOlderMessages.forEach(msg => messageIds.current.add(msg.idMessage));

            setMessages(prevMessages => [...prevMessages, ...filteredOlderMessages]);

            console.log("Older messages loaded:", filteredOlderMessages.length);
        } catch (error) {
            console.error("Error fetching older messages:", error);
        }

        setLoadingHistory(false);
    };

    // Handle Sending Message 
    const handleSendMessage = async (message) => {
        if (!message.trim()) return;

        try {
            const response = await sendMessage(credentials.idInstance, credentials.apiTokenInstance, chat.id, message);

            if (response) {
                console.log("Message sent successfully:", response);
                const sentMessage = {
                    textMessage: message,
                    typeMessage: "textMessage",
                    type: "outgoing",
                    chatId: chat.id,
                    timestamp: Math.floor(Date.now() / 1000),
                    idMessage: `sent-${Date.now()}`
                };

                addNewMessage(sentMessage);
                socket.emit("sendMessage", sentMessage);

                // Scroll to bottom after sending message
                setTimeout(() => {
                    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
                }, 100);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    //Add New Message to Chat (Prevents Duplicates & Ensures Chat Separation)
    const addNewMessage = (newMessage) => {
        if (newMessage.chatId !== chat.id || messageIds.current.has(newMessage.idMessage)) return;

        messageIds.current.add(newMessage.idMessage);
        setMessages(prevMessages => [newMessage, ...prevMessages]); // Newest messages first

        // Scroll to bottom when a new message arrives
        setTimeout(() => {
            messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
        }, 100);
    };

    return (
        <div className="chat-window">

            <div className="chat-header">
                <div className="chat-avatar">
                    <img 
                        src={contactAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random`} 
                        alt="Avatar" 
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random`; }} 
                    />
                    <h3>{contactName}</h3>
                </div>
            </div>

            <div className="message-list-container" ref={messageListRef} onScroll={(e) => {
                if (e.target.scrollTop === 0 && !loadingHistory && hasMoreHistory) {
                    loadOlderMessages();
                }
            }}>
                {loadingHistory && <p className="loading">Loading older messages...</p>}
                <MessageList messages={messages} credentials={credentials} />
            </div>
            <MessageInput onSendMessage={handleSendMessage} />
        </div>
    );
};

export default ChatWindow;
*/
