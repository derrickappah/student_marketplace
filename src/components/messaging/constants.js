/**
 * Constants for the messaging system
 */

/**
 * Message status constants
 */
export const MESSAGE_STATUS = {
  SENDING: 'sending',   // Message is being sent
  SENT: 'sent',         // Message has been sent to the server
  DELIVERED: 'delivered', // Message has been delivered to the recipient
  READ: 'read',         // Message has been read by the recipient
  FAILED: 'failed'      // Message failed to send
};

/**
 * Message type constants
 */
export const MESSAGE_TYPE = {
  TEXT: 'text',         // Regular text message
  IMAGE: 'image',       // Image message
  FILE: 'file',         // File attachment
  SYSTEM: 'system',     // System message (e.g., "User X joined the conversation")
  OFFER: 'offer',       // Offer message for marketplace listings
  LOCATION: 'location'  // Location sharing
};

/**
 * Conversation type constants
 */
export const CONVERSATION_TYPE = {
  DIRECT: 'direct',     // One-to-one conversation
  GROUP: 'group',       // Group conversation
  LISTING: 'listing'    // Conversation about a marketplace listing
}; 