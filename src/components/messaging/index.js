export { default as MessageBubble } from './MessageBubble';
export { default as MessageAttachmentUploader } from './MessageAttachmentUploader';
export { default as TypingIndicator } from './TypingIndicator';
export { MESSAGE_STATUS } from './constants';
export { downloadMessageAttachment, downloadConversationAttachments } from '../../services/supabase';

// Utility function to download message attachments
export const downloadAttachment = async (attachment) => {
  try {
    console.log("Starting download via helper function:", attachment);
    
    if (!attachment) {
      throw new Error("Invalid attachment: attachment is undefined");
    }
    
    const { downloadMessageAttachment } = await import('../../services/supabase');
    const result = await downloadMessageAttachment(attachment);
    
    if (!result.success) {
      console.error("Download failed:", result.error);
      throw new Error(result.error || "Unknown download error");
    }
    
    return result;
  } catch (error) {
    console.error("Error in downloadAttachment helper:", error);
    return { success: false, error: error.message || "Download failed" };
  }
};

// Utility function to download all attachments in a conversation as ZIP
export const downloadAllConversationAttachments = async (conversationId, participantName) => {
  try {
    console.log("Starting ZIP download via helper function for conversation:", conversationId);
    
    if (!conversationId) {
      throw new Error("Invalid conversation ID: conversationId is undefined");
    }
    
    const { downloadConversationAttachments } = await import('../../services/supabase');
    const result = await downloadConversationAttachments(conversationId, participantName);
    
    if (!result.success) {
      console.error("ZIP download failed:", result.error);
      throw new Error(result.error || "Unknown download error");
    }
    
    return result;
  } catch (error) {
    console.error("Error in downloadAllConversationAttachments helper:", error);
    return { success: false, error: error.message || "Download failed" };
  }
}; 