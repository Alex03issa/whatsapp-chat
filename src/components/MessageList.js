import React from "react";
import "./MessageList.css";
import { FaFileAlt, FaMicrophone, FaPlayCircle, FaRegImage, FaVideo } from "react-icons/fa";

const MessageList = ({ messages, credentials }) => {
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    let lastDate = null;

    return (
        <ul className="message-list">
            {sortedMessages.length === 0 ? (
                <p className="no-messages">No messages yet...</p>
            ) : (
                sortedMessages.map((msg, index) => {
                    const isOutgoing = msg.type === "outgoing" || msg.senderId === credentials?.idInstance;
                    const isIncoming = msg.type === "incoming" || (!isOutgoing && msg.senderId !== credentials?.idInstance);

                    const messageDate = new Date(msg.timestamp * 1000).toLocaleDateString();
                    const showDateSeparator = messageDate !== lastDate;
                    lastDate = messageDate;


                    return (
                        <React.Fragment key={index}>
                            {showDateSeparator && (
                                <li className="date-separator">
                                    <span>{messageDate}</span>
                                </li>
                            )}
                            <li className={`message ${isIncoming ? "incoming" : "outgoing"}`}>
                                <div className="message-content">
                                    
                                    {/*  Handle Text Messages, including "extendedTextMessage" */}
                                    {["textMessage", "extendedTextMessage"].includes(msg.typeMessage) && msg.textMessage && (
                                        <p className="message-text">
                                            {msg.textMessage}
                                            <span className="timestamp">
                                                {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </p>
                                    )}

                                    {/*  Handle Image Messages */}
                                    {msg.typeMessage === "imageMessage" && msg.imageUrl ? (
                                        <div className="message-image">
                                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                <FaRegImage className="message-icon" />
                                                <img src={msg.imageUrl} alt="Sent image" />
                                            </a>
                                            <span className="timestamp">
                                                {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    ) : msg.typeMessage === "imageMessage" && (
                                        <p className="message-placeholder"><FaRegImage className="message-icon" /> Image Message</p>
                                    )}

                                    {/*  Handle Audio Messages */}
                                    {msg.typeMessage === "audioMessage" && msg.audioUrl ? (
                                        <div className="message-audio">
                                            <FaMicrophone className="message-icon" />
                                            <audio controls>
                                                <source src={msg.audioUrl} type="audio/mpeg" />
                                                Your browser does not support the audio element.
                                            </audio>
                                            <span className="timestamp">
                                                {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    ) : msg.typeMessage === "audioMessage" && (
                                        <p className="message-placeholder"><FaMicrophone className="message-icon" /> Voice Message</p>
                                    )}

                                    {/*  Handle Video Messages */}
                                    {msg.typeMessage === "videoMessage" && msg.videoUrl ? (
                                        <div className="message-video">
                                            <FaPlayCircle className="message-icon" />
                                            <video controls>
                                                <source src={msg.videoUrl} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                            <span className="timestamp">
                                                {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    ) : msg.typeMessage === "videoMessage" && (
                                        <p className="message-placeholder"><FaPlayCircle className="message-icon" /> Video Message</p>
                                    )}

                                    {/*  Handle Document Messages */}
                                    {msg.typeMessage === "documentMessage" && msg.documentUrl ? (
                                        <div className="message-document">
                                            <a href={msg.documentUrl} target="_blank" rel="noopener noreferrer">
                                                <FaFileAlt className="message-icon" /> View Document
                                            </a>
                                            <span className="timestamp">
                                                {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    ) : msg.typeMessage === "documentMessage" && (
                                        <p className="message-placeholder"><FaFileAlt className="message-icon" /> Document</p>
                                    )}

                                    {/* Mark Calls as Unsupported */}
                                    {["voiceCallMessage", "videoCallMessage"].includes(msg.typeMessage) && (
                                        <p className="message-placeholder">
                                            Unsupported message type: {msg.typeMessage}
                                        </p>
                                    )}

                                    {/* Handle Unknown Message Types */}
                                    {!["textMessage", "extendedTextMessage", "imageMessage", "audioMessage", "videoMessage", "documentMessage"].includes(msg.typeMessage) && (
                                        <p className="message-text">
                                            Unsupported message type: {msg.typeMessage}
                                            <span className="timestamp">
                                                {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </li>
                        </React.Fragment>
                    );
                })
            )}
        </ul>
    );
};

export default MessageList;
