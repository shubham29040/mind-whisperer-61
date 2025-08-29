import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useLocalChatStorage } from './useLocalChatStorage';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  mood?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const { 
    addConversation: addLocalConversation, 
    addMessage: addLocalMessage, 
    getMessages: getLocalMessages, 
    getConversations: getLocalConversations 
  } = useLocalChatStorage();

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      
      // First try to load from local storage
      const localMessages = getLocalMessages(conversationId);
      if (localMessages.length > 0) {
        setMessages(localMessages);
        setIsLoading(false);
        return;
      }

      // Fallback to Supabase if no local messages
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.created_at),
        mood: msg.mood
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, getLocalMessages]);

  // Create new conversation
  const createConversation = useCallback(async (firstMessage?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Create local conversation if not authenticated
        const localConv: Conversation = {
          id: `local-${Date.now()}`,
          title: firstMessage ? 
            firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '') : 
            'New Conversation',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        addLocalConversation(localConv);
        setCurrentConversationId(localConv.id);
      setMessages([]);
      return localConv.id;
      }

      const title = firstMessage ? 
        firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '') : 
        'New Conversation';

      // Create both local and remote conversation
      const localConv: Conversation = {
        id: `temp-${Date.now()}`,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      addLocalConversation(localConv);
      setCurrentConversationId(localConv.id);
      setMessages([]);
      return localConv.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
      return null;
    }
  }, [addLocalConversation, toast]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use the chat feature",
          variant: "destructive",
        });
        return;
      }

      let conversationId = currentConversationId;
      
      // Create conversation if none exists
      if (!conversationId) {
        conversationId = await createConversation(content);
        if (!conversationId) return;
      }

      // Add user message to UI and local storage immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      addLocalMessage(conversationId, userMessage);
      setIsTyping(true);

      // Call Gemini API through edge function
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: content,
          conversationId,
          userId: user.id
        }
      });

      if (error) throw error;

      // Add AI response to UI and local storage
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date(),
        mood: data.mood
      };
      setMessages(prev => [...prev, aiMessage]);
      addLocalMessage(conversationId, aiMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  }, [currentConversationId, createConversation, toast, addLocalMessage]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentConversationId) return;

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            sender: payload.new.role as 'user' | 'assistant',
            timestamp: new Date(payload.new.created_at),
            mood: payload.new.mood
          };
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);

  // Load conversations on mount - prioritize local storage
  const loadConversations = useCallback(async () => {
    try {
      // First load from local storage
      const localConversations = getLocalConversations();
      if (localConversations.length > 0) {
        setConversations(localConversations);
      }

      // Also try to load from Supabase if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          // Merge with local conversations, avoiding duplicates
          const mergedConversations = [...localConversations];
          data.forEach(remoteConv => {
            if (!mergedConversations.find(local => local.id === remoteConv.id)) {
              mergedConversations.push(remoteConv);
            }
          });
          setConversations(mergedConversations);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Fallback to local conversations
      const localConversations = getLocalConversations();
      setConversations(localConversations);
    }
  }, [getLocalConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    isTyping,
    sendMessage,
    loadMessages,
    createConversation,
    setCurrentConversationId,
    loadConversations
  };
};