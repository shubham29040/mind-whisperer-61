import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  mood?: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm here to support your mental wellness journey. How are you feeling today? Feel free to share what's on your mind.",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock emotion detection and response generation
  const detectEmotion = (text: string): string => {
    const emotions = {
      sad: ['sad', 'depressed', 'down', 'upset', 'crying', 'hurt'],
      anxious: ['anxious', 'worried', 'nervous', 'stressed', 'panic'],
      angry: ['angry', 'mad', 'frustrated', 'annoyed', 'furious'],
      happy: ['happy', 'good', 'great', 'wonderful', 'excited', 'joy'],
    };

    const lowerText = text.toLowerCase();
    
    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return emotion;
      }
    }
    
    return 'neutral';
  };

  const generateResponse = (mood: string): string => {
    const responses = {
      sad: [
        "I hear that you're going through a difficult time. Remember that it's okay to feel sad - these emotions are valid and temporary. Would you like to try a gentle breathing exercise together?",
        "Thank you for sharing your feelings with me. Sadness can feel overwhelming, but you're not alone in this. Sometimes just acknowledging these feelings is the first step toward healing."
      ],
      anxious: [
        "It sounds like you're feeling anxious right now. Let's take this one step at a time. Try the 4-7-8 breathing technique: breathe in for 4, hold for 7, exhale for 8. You've got this.",
        "Anxiety can make everything feel overwhelming, but remember - you've handled difficult situations before. Focus on what you can control right now."
      ],
      angry: [
        "I can sense your frustration. It's completely normal to feel angry sometimes. Let's channel this energy constructively. What would help you feel more grounded right now?",
        "Anger often signals that something important to us feels threatened. Take a moment to breathe deeply - what's at the core of these feelings?"
      ],
      happy: [
        "It's wonderful to hear that you're feeling good! Happiness is such a beautiful emotion to experience. What's contributing to these positive feelings today?",
        "I love hearing when you're doing well! These positive moments are important to acknowledge and celebrate. Keep nurturing what brings you joy."
      ],
      neutral: [
        "Thank you for sharing with me. I'm here to listen and support you in whatever way feels helpful. What would you like to explore or talk about today?",
        "I appreciate you taking the time to check in. Whether you're having a calm day or processing complex feelings, I'm here to support your journey."
      ]
    };

    const moodResponses = responses[mood as keyof typeof responses] || responses.neutral;
    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const detectedMood = detectEmotion(input);
      const response = generateResponse(detectedMood);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
        mood: detectedMood,
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMoodColor = (mood: string) => {
    const colors = {
      happy: 'bg-green-100 text-green-800 border-green-200',
      sad: 'bg-blue-100 text-blue-800 border-blue-200',
      anxious: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      angry: 'bg-red-100 text-red-800 border-red-200',
      neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[mood as keyof typeof colors] || colors.neutral;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-calm">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-wellness rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">MindCare AI Companion</h1>
            <p className="text-sm text-muted-foreground">Here to support your mental wellness</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'bot' && (
                <div className="w-8 h-8 bg-gradient-wellness rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              
              <div className={`max-w-md ${message.sender === 'user' ? 'order-1' : ''}`}>
                {message.mood && (
                  <Badge className={`mb-2 ${getMoodColor(message.mood)}`}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Detected mood: {message.mood}
                  </Badge>
                )}
                
                <Card className={`
                  ${message.sender === 'user' 
                    ? 'bg-gradient-wellness text-primary-foreground border-primary/20' 
                    : 'bg-card/80 backdrop-blur-sm border-border/50'
                  }
                `}>
                  <CardContent className="p-3">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 opacity-70`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-accent-foreground" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-wellness rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border/50 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts and feelings..."
            className="flex-1 bg-background/50 border-border/50"
            disabled={isTyping}
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-gradient-wellness hover:shadow-glow transition-gentle"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;