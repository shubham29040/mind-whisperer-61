import { useState, useEffect, useCallback } from 'react';
import { Message, Conversation } from './useChat';

interface LocalChatData {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  lastCleanup: number;
}

const STORAGE_KEY = 'mindcare-chat-data';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const useLocalChatStorage = () => {
  const [localData, setLocalData] = useState<LocalChatData>({
    conversations: [],
    messages: {},
    lastCleanup: Date.now()
  });

  // Load data from localStorage
  const loadLocalData = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as LocalChatData;
        setLocalData(data);
        return data;
      }
    } catch (error) {
      console.error('Error loading local chat data:', error);
    }
    return localData;
  }, []);

  // Save data to localStorage
  const saveLocalData = useCallback((data: LocalChatData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLocalData(data);
    } catch (error) {
      console.error('Error saving local chat data:', error);
    }
  }, []);

  // Auto-cleanup old data (7 days)
  const cleanupOldData = useCallback(() => {
    const now = Date.now();
    const cutoffTime = now - SEVEN_DAYS;
    
    const currentData = loadLocalData();
    
    // Filter conversations older than 7 days
    const validConversations = currentData.conversations.filter(conv => {
      const convTime = new Date(conv.created_at).getTime();
      return convTime > cutoffTime;
    });

    // Filter messages for valid conversations only
    const validMessages: Record<string, Message[]> = {};
    validConversations.forEach(conv => {
      if (currentData.messages[conv.id]) {
        // Also filter individual messages by timestamp
        validMessages[conv.id] = currentData.messages[conv.id].filter(msg => 
          msg.timestamp.getTime() > cutoffTime
        );
      }
    });

    const cleanedData: LocalChatData = {
      conversations: validConversations,
      messages: validMessages,
      lastCleanup: now
    };

    saveLocalData(cleanedData);
    console.log(`Cleaned up old chat data. Removed ${currentData.conversations.length - validConversations.length} conversations`);
  }, [loadLocalData, saveLocalData]);

  // Add new conversation
  const addConversation = useCallback((conversation: Conversation) => {
    const currentData = loadLocalData();
    const newData = {
      ...currentData,
      conversations: [conversation, ...currentData.conversations]
    };
    saveLocalData(newData);
  }, [loadLocalData, saveLocalData]);

  // Add message to conversation
  const addMessage = useCallback((conversationId: string, message: Message) => {
    const currentData = loadLocalData();
    const newData = {
      ...currentData,
      messages: {
        ...currentData.messages,
        [conversationId]: [
          ...(currentData.messages[conversationId] || []),
          message
        ]
      }
    };
    saveLocalData(newData);
  }, [loadLocalData, saveLocalData]);

  // Get messages for conversation
  const getMessages = useCallback((conversationId: string): Message[] => {
    const currentData = loadLocalData();
    return currentData.messages[conversationId] || [];
  }, [loadLocalData]);

  // Get all conversations
  const getConversations = useCallback((): Conversation[] => {
    const currentData = loadLocalData();
    return currentData.conversations;
  }, [loadLocalData]);

  // Initialize and setup cleanup
  useEffect(() => {
    loadLocalData();
    
    // Check if cleanup is needed (every day)
    const currentData = loadLocalData();
    const timeSinceLastCleanup = Date.now() - currentData.lastCleanup;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (timeSinceLastCleanup > oneDayMs) {
      cleanupOldData();
    }

    // Set up periodic cleanup (every hour)
    const cleanupInterval = setInterval(() => {
      const data = loadLocalData();
      const hoursSinceCleanup = (Date.now() - data.lastCleanup) / (1000 * 60 * 60);
      
      if (hoursSinceCleanup >= 24) { // Cleanup once per day
        cleanupOldData();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(cleanupInterval);
  }, [loadLocalData, cleanupOldData]);

  return {
    addConversation,
    addMessage,
    getMessages,
    getConversations,
    cleanupOldData,
    localData
  };
};