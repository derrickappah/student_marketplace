// Export all messaging components
export { default as MessageBubble } from './MessageBubble';
export { default as UserAvatar } from './UserAvatar';
export { default as ConversationList } from './ConversationList';
export { default as MessageInput } from './MessageInput';
export { default as ConversationHeader } from './ConversationHeader';
export { default as UserSelector } from './UserSelector';
export { default as NewConversationModal } from './NewConversationModal';
export { default as TypingIndicator } from './TypingIndicator';
export { default as MessageAttachmentUploader } from './MessageAttachmentUploader';
export { default as SafeImage } from './SafeImage';
export { default as ListingImageGallery } from './ListingImageGallery';

// Export messaging constants
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system'
};

export const CONVERSATION_TYPE = {
  DIRECT: 'direct',
  GROUP: 'group'
}; 