// Edge function to handle message notifications
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_status?: string;
  has_attachments?: boolean;
}

interface Conversation {
  id: string;
  participants: {
    user_id: string;
    user: {
      id: string;
      name: string;
      avatar_url?: string;
      email: string;
    };
  }[];
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
        status: 204,
      });
    }

    // Parse request data
    const { message, auth } = await req.json();

    // Validate required data
    if (!message || !message.conversation_id || !message.sender_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields in request",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation participants
    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .select(
        `
        id,
        participants:conversation_participants(
          user_id,
          user:users(id, name, avatar_url, email)
        )
      `
      )
      .eq("id", message.conversation_id)
      .single();

    if (conversationError || !conversationData) {
      console.error("Error fetching conversation:", conversationError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch conversation",
          details: conversationError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Find recipients (everyone except the sender)
    const recipients = conversationData.participants.filter(
      (p) => p.user_id !== message.sender_id
    );

    // No recipients, just return success
    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No recipients to notify",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get sender details
    const sender = conversationData.participants.find(
      (p) => p.user_id === message.sender_id
    )?.user;

    if (!sender) {
      console.error("Sender not found in conversation participants");
      return new Response(
        JSON.stringify({
          error: "Sender not found in conversation",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Process each recipient
    const results = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          // Create notification
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              user_id: recipient.user_id,
              type: "message",
              message: `New message from ${sender.name}: ${message.content.substring(0, 50)}${
                message.content.length > 50 ? "..." : ""
              }`,
              conversation_id: message.conversation_id,
              read: false,
              created_at: new Date().toISOString(),
            });

          if (notificationError) {
            console.error("Error creating notification:", notificationError);
            return {
              recipient_id: recipient.user_id,
              success: false,
              error: notificationError,
            };
          }

          // Create or update message read receipt for recipient (set to delivered)
          const { error: receiptError } = await supabase
            .from("message_read_receipts")
            .upsert({
              message_id: message.id,
              user_id: recipient.user_id,
              status: "delivered",
              updated_at: new Date().toISOString(),
            });

          if (receiptError) {
            console.error("Error creating read receipt:", receiptError);
          }

          return {
            recipient_id: recipient.user_id,
            success: true,
          };
        } catch (error) {
          console.error(`Error processing recipient ${recipient.user_id}:`, error);
          return {
            recipient_id: recipient.user_id,
            success: false,
            error,
          };
        }
      })
    );

    // Update message status to delivered
    await supabase
      .from("messages")
      .update({ read_status: "delivered" })
      .eq("id", message.id);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Unexpected error occurred",
        details: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 