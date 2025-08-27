import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useChat } from '@/hooks/useChat';
import { useState } from 'react';

const Chat = () => {
  const [input, setInput] = useState('');
  const { 
    messages, 
    isLoading, 
    isTyping, 
    sendMessage,
    conversations,
    currentConversationId,
    createConversation,
    loadMessages,
    setCurrentConversationId
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const messageText = input;
    setInput('');
    await sendMessage(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMoodColor = (mood?: string) => {
    if (!mood) return 'bg-muted';
    switch (mood) {
      case 'happy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sad': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'anxious': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'angry': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-muted';
    }
  };

  const handleNewConversation = async () => {
    await createConversation();
  };

  const handleSelectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    await loadMessages(conversationId);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Conversations Sidebar - Hidden on mobile, shown on larger screens */}
      <div className="w-80 border-r border-border bg-card p-4 hidden lg:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
          <Button 
            size="sm" 
            onClick={handleNewConversation}
            className="bg-primary hover:bg-primary/90"
          >
            New Chat
          </Button>
        </div>
        <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                currentConversationId === conversation.id 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className="font-medium text-sm text-foreground truncate">
                {conversation.title}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(conversation.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">MindCare Chat</h1>
              <p className="text-sm text-muted-foreground">Your AI Mental Wellness Companion</p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* New Chat button for mobile */}
              <Button 
                size="sm" 
                onClick={handleNewConversation}
                className="lg:hidden bg-primary hover:bg-primary/90"
              >
                New
              </Button>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                🟢 Online
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-4xl md:text-6xl mb-4">🧠</div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Welcome to MindCare</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base px-4">
                I'm here to support your mental wellness journey. Share what's on your mind, and let's work through it together.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card border border-border'
              }`}>
                <div className="flex items-start space-x-2 md:space-x-3">
                  <div className="text-xl md:text-2xl flex-shrink-0">
                    {message.sender === 'user' ? '👤' : '🧠'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-xs opacity-70 flex-shrink-0">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.mood && message.sender === 'user' && (
                        <Badge className={`text-xs ${getMoodColor(message.mood)} flex-shrink-0`}>
                          {message.mood}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <Card className="max-w-[85%] md:max-w-[80%] p-3 md:p-4 bg-card border border-border">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="text-xl md:text-2xl">🧠</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <Separator />

        {/* Input Area */}
        <div className="p-4 bg-card/50 backdrop-blur-sm">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="flex-1 bg-background border-border focus:border-primary"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            >
              Send
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center px-2">
            MindCare is here to support you. In crisis situations, please contact emergency services.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;