/**
 * API service for chat widget
 */

const DEFAULT_API_URL = window.location.origin;

/**
 * Send chat message to backend
 */
export async function sendChatMessage(data, apiUrl = DEFAULT_API_URL) {
  try {
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get welcome message from backend
 */
export async function getWelcomeMessage(shop, apiUrl = DEFAULT_API_URL) {
  try {
    const response = await fetch(
      `${apiUrl}/api/chat/welcome?shop=${encodeURIComponent(shop)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting welcome message:', error);
    return { message: 'Hi! How can I help you today?' };
  }
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId, shop, apiUrl = DEFAULT_API_URL) {
  try {
    const response = await fetch(
      `${apiUrl}/api/chat/conversation/${conversationId}?shop=${encodeURIComponent(shop)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
}

