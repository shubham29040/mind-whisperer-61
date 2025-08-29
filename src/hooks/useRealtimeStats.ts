import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useLocalChatStorage } from './useLocalChatStorage';
import { useRealtimeMoodAnalytics } from './useRealtimeMoodAnalytics';

interface UserStats {
  dailyStreak: number;
  totalChats: number;
  totalMessages: number;
  averageSessionLength: number;
  lastActiveDate: string;
  wellnessScore: number;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedDate?: string;
    progress?: number;
    target?: number;
  }>;
  dailyGoals: {
    chatGoal: { current: number; target: number; completed: boolean };
    moodCheckGoal: { current: number; target: number; completed: boolean };
    streakGoal: { current: number; target: number; completed: boolean };
  };
}

export const useRealtimeStats = () => {
  const { user } = useAuth();
  const { getConversations, getMessages, localData } = useLocalChatStorage();
  const { analytics } = useRealtimeMoodAnalytics();
  
  const [stats, setStats] = useState<UserStats>({
    dailyStreak: 0,
    totalChats: 0,
    totalMessages: 0,
    averageSessionLength: 0,
    lastActiveDate: '',
    wellnessScore: 50,
    achievements: [],
    dailyGoals: {
      chatGoal: { current: 0, target: 3, completed: false },
      moodCheckGoal: { current: 0, target: 1, completed: false },
      streakGoal: { current: 0, target: 7, completed: false }
    }
  });

  // Define achievements
  const achievementDefinitions = [
    {
      id: 'first_chat',
      title: 'पहली बातचीत',
      description: 'अपनी पहली AI बातचीत पूरी की',
      icon: '👋',
      target: 1,
      checkFn: (stats: any) => stats.totalChats >= 1
    },
    {
      id: 'week_streak',
      title: '7 दिन का सिलसिला',
      description: '7 दिन लगातार ऐप का इस्तेमाल किया',
      icon: '🔥',
      target: 7,
      checkFn: (stats: any) => stats.dailyStreak >= 7
    },
    {
      id: 'chat_master',
      title: 'बातचीत के मास्टर',
      description: '50 बातचीत पूरी कीं',
      icon: '💬',
      target: 50,
      checkFn: (stats: any) => stats.totalChats >= 50
    },
    {
      id: 'mood_tracker',
      title: 'मूड ट्रैकर',
      description: '30 दिन मूड ट्रैक किया',
      icon: '📊',
      target: 30,
      checkFn: (stats: any) => analytics.insights.totalDays >= 30
    },
    {
      id: 'wellness_champion',
      title: 'वेलनेस चैंपियन',
      description: '80+ वेलनेस स्कोर हासिल किया',
      icon: '🏆',
      target: 80,
      checkFn: (stats: any) => stats.wellnessScore >= 80
    },
    {
      id: 'daily_achiever',
      title: 'दैनिक लक्ष्य',
      description: '10 दिन लगातार दैनिक लक्ष्य पूरे किए',
      icon: '🎯',
      target: 10,
      checkFn: (stats: any) => stats.dailyStreak >= 10
    },
    {
      id: 'message_marathon',
      title: 'मैसेज मैराथन',
      description: '1000 मैसेज भेजे',
      icon: '✉️',
      target: 1000,
      checkFn: (stats: any) => stats.totalMessages >= 1000
    },
    {
      id: 'happy_days',
      title: 'खुशी के दिन',
      description: '20 दिन खुश रहे',
      icon: '😊',
      target: 20,
      checkFn: (stats: any) => analytics.moodHistory.filter(h => h.mood === 'happy').length >= 20
    }
  ];

  // Calculate user statistics
  const calculateStats = useCallback(() => {
    const conversations = getConversations();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Calculate basic stats
    const totalChats = conversations.length;
    let totalMessages = 0;
    let totalSessionTime = 0;
    
    // Calculate daily streak
    let streak = 0;
    let checkDate = new Date();
    const userActivityDays = new Set<string>();
    
    // Collect all activity days and calculate totals
    conversations.forEach(conv => {
      const messages = getMessages(conv.id);
      totalMessages += messages.length;
      
      // Add conversation date to activity days
      const convDate = new Date(conv.created_at);
      userActivityDays.add(convDate.toISOString().split('T')[0]);
      
      // Calculate session length (approximate)
      if (messages.length > 1) {
        const firstMsg = new Date(messages[0].timestamp);
        const lastMsg = new Date(messages[messages.length - 1].timestamp);
        totalSessionTime += (lastMsg.getTime() - firstMsg.getTime()) / (1000 * 60); // minutes
      }
    });

    // Calculate streak by checking consecutive days
    while (streak < 365) { // Max check 1 year
      const dateKey = checkDate.toISOString().split('T')[0];
      if (userActivityDays.has(dateKey)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const averageSessionLength = conversations.length > 0 ? totalSessionTime / conversations.length : 0;
    const lastActiveDate = conversations.length > 0 ? conversations[0].updated_at : '';

    // Calculate wellness score based on multiple factors
    const wellnessScore = Math.min(100, Math.round(
      (analytics.insights.averageMood * 10) + // 0-100 from mood
      (Math.min(streak, 30) * 2) + // Up to 60 from streak
      (Math.min(analytics.insights.totalDays, 30)) // Up to 30 from consistency
    ));

    // Calculate daily goals
    const todaysChats = conversations.filter(conv => 
      conv.created_at.startsWith(today)
    ).length;
    
    const todaysMoodChecks = analytics.moodHistory.filter(h => 
      h.date === today
    ).length;

    const dailyGoals = {
      chatGoal: { 
        current: todaysChats, 
        target: 3, 
        completed: todaysChats >= 3 
      },
      moodCheckGoal: { 
        current: todaysMoodChecks, 
        target: 1, 
        completed: todaysMoodChecks >= 1 
      },
      streakGoal: { 
        current: streak, 
        target: 7, 
        completed: streak >= 7 
      }
    };

    // Calculate achievements
    const achievements = achievementDefinitions.map(achievement => {
      const tempStats = {
        totalChats,
        totalMessages,
        dailyStreak: streak,
        wellnessScore
      };
      
      const earned = achievement.checkFn(tempStats);
      const progress = achievement.target ? 
        Math.min(100, Math.round((tempStats[achievement.id.includes('chat') ? 'totalChats' : 
          achievement.id.includes('message') ? 'totalMessages' :
          achievement.id.includes('streak') ? 'dailyStreak' : 'wellnessScore'] / achievement.target) * 100)) : 0;

      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        earned,
        earnedDate: earned ? today : undefined,
        progress: earned ? 100 : progress,
        target: achievement.target
      };
    });

    setStats({
      dailyStreak: streak,
      totalChats,
      totalMessages,
      averageSessionLength: Math.round(averageSessionLength),
      lastActiveDate,
      wellnessScore,
      achievements,
      dailyGoals
    });
  }, [getConversations, getMessages, analytics]);

  // Update stats when data changes
  useEffect(() => {
    if (user) {
      calculateStats();
    }
  }, [user, localData, analytics, calculateStats]);

  // Real-time updates every minute
  useEffect(() => {
    if (user) {
      const interval = setInterval(calculateStats, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [user, calculateStats]);

  return {
    stats,
    refreshStats: calculateStats
  };
};