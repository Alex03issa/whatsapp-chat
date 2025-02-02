import axios from "axios";

const BASE_URL = "https://api.green-api.com"; 

export const getInstanceState = async (idInstance, apiTokenInstance) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`
        );
        return response.data;
    } catch (error) {
        console.error("Error getting instance state:", error.response?.data || error);
        return null;
    }
};

export const getChats = async (idInstance, apiTokenInstance) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/waInstance${idInstance}/getChats/${apiTokenInstance}`,
            { headers: { "Content-Type": "application/json" } }
        );
        console.log("API Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching chats:", error.response ? error.response.data : error.message);
        return [];
    }
};


export const sendMessage = async (idInstance, apiTokenInstance, chatId, message) => {
    try {
      const instanceState = await getInstanceState(idInstance, apiTokenInstance);
      
      if (instanceState?.stateInstance !== "authorized") {
        console.warn("Instance is not authorized. Cannot send message.");
        return null;
      }
  
      const response = await axios.post(
        `${BASE_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,
        {
          chatId: chatId, 
          message: message
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error);
      return null;
    }
  };
  
export const getLastIncomingMessages = async (idInstance, apiTokenInstance) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/waInstance${idInstance}/lastIncomingMessages/${apiTokenInstance}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching incoming messages:", error.response?.data || error);
        return [];
    }
};


export const getMessageById = async (idInstance, apiTokenInstance, messageId) => {
    try {
        const response = await axios.post(
            `${BASE_URL}/waInstance${idInstance}/getMessage/${apiTokenInstance}`,
            { messageId }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching message by ID:", error.response?.data || error);
        return null;
    }
};

export const getChatHistory = async (idInstance, apiTokenInstance, chatId, count = 10) => {
    try {
        const instanceState = await getInstanceState(idInstance, apiTokenInstance);
      
        if (instanceState?.stateInstance !== "authorized") {
            console.warn("Instance is not authorized. Cannot fetch chat history.");
            return null;
        }

        const response = await axios.post(
            `${BASE_URL}/waInstance${idInstance}/getChatHistory/${apiTokenInstance}`,
            {
                chatId: chatId,
                count: count
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error fetching chat history:", error.response?.data || error);
        return null;
    }
};


export const getContactInfo = async (idInstance, apiTokenInstance, chatId) => {
    const response = await fetch(`https://api.green-api.com/waInstance${idInstance}/getContactInfo/${apiTokenInstance}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
    });

    if (!response.ok) {
        throw new Error(`Error fetching contact info: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
};


export const receiveMessages = async (idInstance, apiTokenInstance) => {
    try {
        const response = await fetch(
            `https://api.green-api.com/waInstance${idInstance}/ReceiveNotification/${apiTokenInstance}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const textResponse = await response.text(); 
        console.log("🔍 Raw API Response:", textResponse);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonResponse = JSON.parse(textResponse); 
        return jsonResponse;
    } catch (error) {
        console.error("Error in receiveMessages:", error);
        return [];
    }
};


export const deleteNotification = async (idInstance, apiTokenInstance, receiptId) => {
    try {
        const response = await fetch(
            `https://api.green-api.com/waInstance${idInstance}/DeleteNotification/${apiTokenInstance}/${receiptId}`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete notification");
        }

        console.log("Successfully deleted notification:", receiptId);
    } catch (error) {
        console.error("Error deleting notification:", error);
    }
};
