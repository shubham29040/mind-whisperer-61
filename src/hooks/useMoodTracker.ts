import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MoodEntry {
  id: string;
  mood_score: number;
  mood_category: string;
  notes?: string;
  activities?: string[];
  created_at: string;
}

export const useMoodTracker = () => {
  const [currentMood, setCurrentMood] = useState<string>('neutral');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load mood entries
  const loadMoodEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setMoodEntries(data || []);
      
      // Set current mood from most recent entry
      if (data && data.length > 0) {
        setCurrentMood(data[0].mood_category);
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new mood entry
  const addMoodEntry = async (mood_category: string, mood_score: number, notes?: string, activities?: string[]) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood_category,
          mood_score,
          notes,
          activities
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentMood(mood_category);
      setMoodEntries(prev => [data, ...prev]);
      
      return data;
    } catch (error) {
      console.error('Error adding mood entry:', error);
      throw error;
    }
  };

  // Real-time subscription for mood updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('mood_entries_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mood_entries',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newEntry = payload.new as MoodEntry;
          setMoodEntries(prev => [newEntry, ...prev]);
          setCurrentMood(newEntry.mood_category);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load initial data
  useEffect(() => {
    loadMoodEntries();
  }, [user]);

  return {
    currentMood,
    moodEntries,
    loading,
    addMoodEntry,
    loadMoodEntries
  };
};