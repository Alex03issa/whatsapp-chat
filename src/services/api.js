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
    const response = await fetch(`${BASE_URL}/waInstance${idInstance}/getContactInfo/${apiTokenInstance}`, {
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


/**
 * Take the next notification from the GREEN-API queue.
 * Returns null when the queue is empty. Throws on network / HTTP errors.
 */
export const receiveNotification = async (idInstance, apiTokenInstance, signal) => {
    const response = await axios.get(
        `${BASE_URL}/waInstance${idInstance}/ReceiveNotification/${apiTokenInstance}`,
        { signal }
    );
    return response.data || null;
};

/**
 * Remove a processed notification from the queue so the next one can be received.
 */
export const deleteNotification = async (idInstance, apiTokenInstance, receiptId, signal) => {
    const response = await axios.delete(
        `${BASE_URL}/waInstance${idInstance}/DeleteNotification/${apiTokenInstance}/${receiptId}`,
        { signal }
    );
    return response.data?.result === true;
};
