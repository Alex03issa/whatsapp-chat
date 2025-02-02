# WhatsApp Chat App

## Overview

This is a React-based web application that allows users to send and receive WhatsApp messages using the **GREEN-API**. The application mimics the interface of **WhatsApp Web** and enables real-time communication through HTTP polling.

## Features

- **User Authentication:** Users enter their **idInstance** and **apiTokenInstance** from GREEN-API to access the app.
### 🔹 Login with Instances
![Login](/assets/whatsapp_chat6.png)

![Login](/assets/whatsapp_chat7.png)

### 🔹 Logout
![Logout](/assets/whatsapp_chat2.jpg)


- **Chat Interface:** UI similar to WhatsApp Web, listing active conversations and displaying message history.

### 🔹 Chat Interface
![Chat Interface](/assets/whatsapp_chat0.png)

### 🔹 Creating a New Chat
![Creating a Chat](/assets/whatsapp_chat1.png)



- **Send Messages:** Users can send text messages to a specified WhatsApp number.

### 🔹 Sending Messages
![Sending Messages](/assets/whatsapp_chat8.png)

- **Receive Messages:** Incoming messages are retrieved using the HTTP API polling method.

### 🔹 Receiving a Message
![Receiving a Message](/assets/whatsapp_chat3.jpg)

- **Delete Notifications:** After processing a message, notifications are deleted to allow new ones to arrive.

- **Contact Info Fetching:** Retrieves the **chat name** and **avatar** instead of displaying only chat IDs.

### 🔹 Contact Info Display
![Contact Info](/assets/whatsapp_chat4.jpg)

### 🔹 Message Types (Text, Images, Audio)
![Message Types](/assets/whatsapp_chat5.png)


## Technologies Used

- **React.js** (Frontend)
- **Node.js & Express** (Backend for API calls)
- **CSS** (Styling)
- **GREEN-API** (WhatsApp API service)

## Project Structure

```
whatsapp-chat/
│── public/              # Static assets (images, icons)
│── src/
│   ├── components/      # UI components
│   │   ├── ChatWindow.js
│   │   ├── ChatWindow.css
│   │   ├── MessageList.js
│   │   ├── MessageList.css
│   │   ├── MessageInput.js
│   │   ├── MessageInput.css
│   │   ├── LoginForm.js
│   │   ├── LoginForm.css
│   ├── pages/           # Main application pages
│   │   ├── Home.js
│   │   ├── Home.css
│   │   ├── Login.js
│   ├── services/        # API service functions
│   │   ├── api.js
│   ├── App.js           # Main React component
│   ├── index.js         # Entry point
│   ├── index.css        # Global styles
│── server.js            # Backend server for API proxy
│── package.json         # Dependencies and scripts
│── README.md            # Project documentation
```

## Setup & Installation

### Prerequisites

- **Node.js** (v14+ recommended)
- **npm or yarn**
- **GREEN-API Account**

### Steps to Run the Project

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/whatsapp-chat.git
   cd whatsapp-chat
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open the application in a browser at:
   ```
   http://localhost:3000
   ```
5. Log in using your GREEN-API **idInstance** and **apiTokenInstance**.
6. Start a new chat by entering a WhatsApp number.
7. Send and receive messages in real-time.

## API Integration

### Sending Messages

Uses `https://api.green-api.com/waInstance{idInstance}/SendMessage/{apiTokenInstance}`

- Implemented in `sendMessage()` inside `api.js`
- Sends a message to a specified WhatsApp number.

### Receiving Messages (Using HTTP API Polling)

Uses `https://api.green-api.com/waInstance{idInstance}/ReceiveNotification/{apiTokenInstance}`

- Implemented in `receiveMessages()` inside `api.js`
- Uses HTTP polling to check for new messages.
- Retrieves notifications and filters messages only for active chats.
- Processes messages and deletes notifications after retrieval using `deleteNotification()`.

### Deleting Notifications

Uses `https://api.green-api.com/waInstance{idInstance}/DeleteNotification/{receiptId}/{apiTokenInstance}`

- Implemented in `deleteNotification()` inside `api.js`
- Ensures only new messages are fetched by removing processed notifications.

### Fetching Chat History

Uses `https://api.green-api.com/waInstance{idInstance}/getChatHistory/{apiTokenInstance}`

- Implemented in `getChatHistory()` inside `api.js`
- Retrieves past messages for a chat.

### Fetching Chat List

Uses `https://api.green-api.com/waInstance{idInstance}/getChats/{apiTokenInstance}`

- Implemented in `getChats()` inside `api.js`
- Lists all active conversations.

### Fetching Contact Info

Uses `https://api.green-api.com/waInstance{idInstance}/getContactInfo/{apiTokenInstance}`

- Implemented in `getContactInfo()` inside `api.js`
- Retrieves **chat name** and **avatar** for a given chat ID.

### Fetching Instance State

Uses `https://api.green-api.com/waInstance{idInstance}/getStateInstance/{apiTokenInstance}`

- Implemented in `getInstanceState()` inside `api.js`
- Checks the connection status of the WhatsApp instance.

## Webhook vs HTTP API Polling

### Webhook (Not Used)

- Listens for new messages **automatically**.
- Requires a **server running 24/7** to handle incoming data.
- More **efficient** but needs additional setup.

### HTTP API Polling (Used in this project)

- Periodically **requests** new messages.
- Runs in the **browser** without needing a server.
- Simpler but requires **manual polling**.

## Issues & Debugging

- If messages are not received, ensure **GREEN-API credentials** are valid.
- If the app does not display messages, check **API response format**.
- Ensure the correct **instance ID and token** are used for API calls.

## Future Improvements

- Implement **WebSockets** for real-time updates instead of polling.
- Support for **media messages (images, videos, documents)**.
- Optimize **performance** for better efficiency.

## Author

- **Alwxander Issa**
- Email: **[alexander.issa@gmail.com](mailto\:alexander.issa@gmail.com)**




