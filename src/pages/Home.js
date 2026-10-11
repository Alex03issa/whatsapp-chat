import React, { useState, useEffect, useRef, useCallback } from "react";
import { getChats } from "../services/api";
import { useNavigate } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";
import useIncomingNotifications from "../hooks/useIncomingNotifications";
import { notificationToMessage, messagePreview } from "../services/notifications";
import { FaEllipsisV, FaEdit } from "react-icons/fa";
import "./Home.css";

const Home = ({ setCredentials, credentials }) => {
    const [chats, setChats] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedChat, setSelectedChat] = useState(null);
    const [newChatNumber, setNewChatNumber] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unread, setUnread] = useState({});          // chatId -> unread count
    const [lastMessages, setLastMessages] = useState({}); // chatId -> last message
    const dropdownRef = useRef(null);  // Ref for dropdown
    const chatSubscribers = useRef(new Map()); // chatId -> handler of the open ChatWindow

    const navigate = useNavigate();

    useEffect(() => {
        if (credentials?.idInstance && credentials?.apiTokenInstance) {
            fetchChats(credentials.idInstance, credentials.apiTokenInstance);
        } else {
            navigate("/login");
        }
    }, [credentials, navigate]);

    // Fetch Chats
    const fetchChats = async (idInstance, apiTokenInstance) => {
        if (!idInstance || !apiTokenInstance) return;

        try {
            const chatList = await getChats(idInstance, apiTokenInstance);
            setChats(Array.isArray(chatList) ? chatList : []);
        } catch (error) {
            console.error("Error fetching chats:", error);
            setChats([]);
        }
    };

    // Lets the open ChatWindow receive new messages for its chat.
    const subscribeToChat = useCallback((chatId, handler) => {
        chatSubscribers.current.set(chatId, handler);
        return () => {
            if (chatSubscribers.current.get(chatId) === handler) {
                chatSubscribers.current.delete(chatId);
            }
        };
    }, []);

    // Every notification goes through here: update the chat list for all chats
    // and forward the message to the chat window if that chat is open.
    const handleNotification = useCallback((body) => {
        const message = notificationToMessage(body);
        if (!message) return;

        const { chatId } = message;

        setChats(prev => {
            const existing = prev.find(chat => chat.id === chatId);
            const others = prev.filter(chat => chat.id !== chatId);
            return [existing || { id: chatId }, ...others]; // most recent chat on top
        });
        setLastMessages(prev => ({ ...prev, [chatId]: message }));

        const openChatHandler = chatSubscribers.current.get(chatId);
        if (openChatHandler) {
            openChatHandler(message);
        } else if (message.type === "incoming") {
            setUnread(prev => ({ ...prev, [chatId]: (prev[chatId] || 0) + 1 }));
        }
    }, []);

    useIncomingNotifications(credentials, handleNotification);

    const openChat = (chat) => {
        setSelectedChat(chat);
        setUnread(prev => {
            if (!prev[chat.id]) return prev;
            const next = { ...prev };
            delete next[chat.id];
            return next;
        });
    };

    // Start a New Chat
    const startNewChat = () => {
        if (!newChatNumber.trim()) return;
        const formattedNumber = `${newChatNumber}@c.us`;

        if (!chats.some(chat => chat.id === formattedNumber)) {
            setChats([...chats, { id: formattedNumber }]);
        }

        openChat({ id: formattedNumber });
        setNewChatNumber("");
        setShowModal(false);
    };

    // Logout
    const handleLogout = () => {
        setCredentials(null);
        localStorage.removeItem("credentials");
        navigate("/login");
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="home-container">
            {/* Sidebar (Chats List) */}
            <div className="sidebar">
                <div className="chat-header">
                    <h3>Chats</h3>

                    <div className="header-icons">
                        <button className="edit-button" onClick={() => setShowModal(true)}>
                            <FaEdit />
                        </button>

                        {/* Settings Dropdown */}
                        <div className="settings-menu" ref={dropdownRef}>
                            <button className="settings-button" onClick={() => setShowDropdown(!showDropdown)}>
                                <FaEllipsisV />
                            </button>

                            {showDropdown && (
                                <div className="settings-dropdown">
                                    <button onClick={() => alert("Profile Settings Coming Soon!")}>Profile</button>
                                    <button onClick={handleLogout}>Logout</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Chat List */}
                <ul className="chat-list">
                    {chats.length > 0 ? (
                        chats
                            .filter(chat => chat.id.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((chat) => (
                                <li
                                    key={chat.id}
                                    className={selectedChat?.id === chat.id ? "selected-chat" : ""}
                                    onClick={() => openChat(chat)}
                                >
                                    <div className="chat-avatar">
                                        <img src={`https://ui-avatars.com/api/?name=${chat.id}&background=random`} alt="Avatar" />
                                    </div>
                                    <div className="chat-info">
                                        <span className="chat-name">{chat.id}</span>
                                        {lastMessages[chat.id] && (
                                            <span className="chat-last-message">{messagePreview(lastMessages[chat.id])}</span>
                                        )}
                                    </div>
                                    {unread[chat.id] > 0 && (
                                        <span className="unread-badge">{unread[chat.id]}</span>
                                    )}
                                </li>
                            ))
                    ) : (
                        <p className="no-chats">No chats found</p>
                    )}
                </ul>
            </div>

            {/* Chat Preview */}
            <div className="chat-preview">
                {selectedChat ? (
                    <ChatWindow chat={selectedChat} credentials={credentials} subscribe={subscribeToChat} />
                ) : (
                    <div className="no-chat-selected">
                        <h2>Welcome to WhatsApp Clone</h2>
                        <p>Select a chat to start messaging</p>
                    </div>
                )}
            </div>


            {/* Modal for New Chat */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>New Chat</h2>
                        <input
                            className="modal-input"
                            type="text"
                            placeholder="Enter phone number..."
                            value={newChatNumber}
                            onChange={(e) => setNewChatNumber(e.target.value)}
                        />
                        <div className="modal-actions">
                            <button className="modal-start" onClick={startNewChat}>Start Chat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
