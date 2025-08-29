import { useState, useEffect, useCallback } from 'react';
import { Message } from './useChat';
import { useLocalChatStorage } from './useLocalChatStorage';

interface MoodAnalytics {
  currentMood: string;
  moodHistory: Array<{
    date: string;
    mood: string;
    score: number;
    messages: number;
  }>;
  weeklyTrend: Array<{
    day: string;
    mood: number;
    date: string;
  }>;
  moodDistribution: Array<{
    mood: string;
    count: number;
    color: string;
  }>;
  insights: {
    averageMood: number;
    bestDay: string;
    totalDays: number;
    streak: number;
  };
}

const MOOD_KEYWORDS = {
  happy: ['खुश', 'खुशी', 'अच्छा लग रहा', 'मजा आ रहा', 'बहुत अच्छा', 'happy', 'great', 'awesome', 'wonderful', 'excellent', 'amazing', 'fantastic', 'joy', 'cheerful'],
  sad: ['दुखी', 'परेशान', 'उदास', 'गम', 'दर्द', 'sad', 'depressed', 'down', 'upset', 'hurt', 'pain', 'sorrow', 'grief', 'crying'],
  anxious: ['चिंता', 'परेशानी', 'डर', 'घबराहट', 'tension', 'anxious', 'worried', 'stress', 'nervous', 'panic', 'fear', 'concern', 'overwhelmed'],
  angry: ['गुस्सा', 'नाराज', 'क्रोध', 'चिढ़', 'angry', 'mad', 'frustrated', 'irritated', 'annoyed', 'furious', 'rage'],
  calm: ['शांत', 'आराम', 'peaceful', 'calm', 'relaxed', 'serene', 'tranquil', 'composed', 'balanced'],
  excited: ['उत्साहित', 'जोश', 'excited', 'thrilled', 'enthusiastic', 'energetic', 'pumped', 'eager'],
  neutral: ['ठीक है', 'सामान्य', 'okay', 'fine', 'normal', 'average', 'neutral', 'so-so']
};

const MOOD_SCORES = {
  happy: 8,
  excited: 9,
  calm: 7,
  neutral: 5,
  anxious: 3,
  sad: 2,
  angry: 2
};

const MOOD_COLORS = {
  happy: '#22c55e',
  excited: '#f59e0b',
  calm: '#3b82f6',
  neutral: '#64748b',
  anxious: '#f59e0b',
  sad: '#3b82f6',
  angry: '#ef4444'
};

export const useRealtimeMoodAnalytics = () => {
  const { getMessages, getConversations, localData } = useLocalChatStorage();
  const [analytics, setAnalytics] = useState<MoodAnalytics>({
    currentMood: 'neutral',
    moodHistory: [],
    weeklyTrend: [],
    moodDistribution: [],
    insights: {
      averageMood: 5,
      bestDay: 'Today',
      totalDays: 0,
      streak: 0
    }
  });

  // Analyze message content for mood
  const analyzeMoodFromMessage = useCallback((content: string): { mood: string; score: number } => {
    const lowerContent = content.toLowerCase();
    
    for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          return {
            mood,
            score: MOOD_SCORES[mood as keyof typeof MOOD_SCORES] || 5
          };
        }
      }
    }
    
    return { mood: 'neutral', score: 5 };
  }, []);

  // Process all messages and generate analytics
  const generateAnalytics = useCallback(() => {
    const conversations = getConversations();
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    // Group messages by day
    const dailyMoods: Record<string, { moods: string[]; scores: number[]; messageCount: number }> = {};
    
    conversations.forEach(conv => {
      const messages = getMessages(conv.id);
      messages.forEach(msg => {
        if (msg.sender === 'user') {
          const msgDate = new Date(msg.timestamp);
          const dateKey = msgDate.toISOString().split('T')[0];
          
          if (!dailyMoods[dateKey]) {
            dailyMoods[dateKey] = { moods: [], scores: [], messageCount: 0 };
          }
          
          const { mood, score } = analyzeMoodFromMessage(msg.content);
          dailyMoods[dateKey].moods.push(mood);
          dailyMoods[dateKey].scores.push(score);
          dailyMoods[dateKey].messageCount++;
        }
      });
    });

    // Generate mood history
    const moodHistory = Object.entries(dailyMoods).map(([date, data]) => {
      const avgScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      const primaryMood = data.moods.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantMood = Object.entries(primaryMood).sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
      
      return {
        date,
        mood: dominantMood,
        score: Math.round(avgScore),
        messages: data.messageCount
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate weekly trend
    const weeklyTrend = last7Days.map(date => {
      const dateKey = date.toISOString().split('T')[0];
      const dayData = dailyMoods[dateKey];
      const avgScore = dayData ? 
        dayData.scores.reduce((sum, score) => sum + score, 0) / dayData.scores.length : 5;
      
      return {
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        mood: Math.round(avgScore),
        date: dateKey
      };
    });

    // Generate mood distribution
    const allMoods = Object.values(dailyMoods).flatMap(data => data.moods);
    const moodCounts = allMoods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
      mood: mood.charAt(0).toUpperCase() + mood.slice(1),
      count,
      color: MOOD_COLORS[mood as keyof typeof MOOD_COLORS] || '#64748b'
    }));

    // Calculate insights
    const allScores = Object.values(dailyMoods).flatMap(data => data.scores);
    const averageMood = allScores.length > 0 ? 
      allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 5;

    const bestDayEntry = weeklyTrend.reduce((best, day) => 
      day.mood > best.mood ? day : best, weeklyTrend[0]);

    // Calculate streak (consecutive days with mood tracking)
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();
    
    while (streak < 30) { // Max 30 days check
      const dateKey = checkDate.toISOString().split('T')[0];
      if (dailyMoods[dateKey]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Get current mood from latest messages
    const latestConv = conversations[0];
    let currentMood = 'neutral';
    if (latestConv) {
      const latestMessages = getMessages(latestConv.id).slice(-5); // Last 5 messages
      const userMessages = latestMessages.filter(msg => msg.sender === 'user');
      if (userMessages.length > 0) {
        const { mood } = analyzeMoodFromMessage(userMessages[userMessages.length - 1].content);
        currentMood = mood;
      }
    }

    setAnalytics({
      currentMood,
      moodHistory,
      weeklyTrend,
      moodDistribution,
      insights: {
        averageMood: Math.round(averageMood * 10) / 10,
        bestDay: bestDayEntry?.day || 'Today',
        totalDays: Object.keys(dailyMoods).length,
        streak
      }
    });
  }, [getConversations, getMessages, analyzeMoodFromMessage]);

  // Update analytics when local data changes
  useEffect(() => {
    generateAnalytics();
  }, [localData, generateAnalytics]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(generateAnalytics, 30000);
    return () => clearInterval(interval);
  }, [generateAnalytics]);

  return {
    analytics,
    analyzeMoodFromMessage,
    refreshAnalytics: generateAnalytics
  };
};