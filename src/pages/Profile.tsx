import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { User, Settings, Shield, Bell, Heart, Award, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMoodTracker } from '@/hooks/useMoodTracker';
import { MoodAvatar } from '@/components/MoodAvatar';
import { NotificationCenter } from '@/components/NotificationCenter';
import { supabase } from '@/integrations/supabase/client';
const Profile = () => {
  const { user, signOut } = useAuth();
  const { currentMood, moodEntries } = useMoodTracker();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    display_name: '',
    avatar_url: ''
  });
  const [preferences, setPreferences] = useState([
    { label: 'Daily Mood Reminders', enabled: true, key: 'mood_reminders' },
    { label: 'Wellness Tips', enabled: true, key: 'wellness_tips' },
    { label: 'Achievement Notifications', enabled: false, key: 'achievement_notifications' },
    { label: 'Weekly Summary', enabled: true, key: 'weekly_summary' }
  ]);

  // Load user profile data
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfileData({
          display_name: data.display_name || user.email?.split('@')[0] || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url
        });

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key: string) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.key === key ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };
  const achievements = [{
    title: '7-Day Streak',
    description: 'Tracked mood for 7 consecutive days',
    icon: '🔥',
    earned: true
  }, {
    title: 'First Steps',
    description: 'Completed your first wellness chat',
    icon: '👣',
    earned: true
  }, {
    title: 'Mindful Moments',
    description: 'Used 10 breathing exercises',
    icon: '🧘',
    earned: false
  }, {
    title: 'Mood Master',
    description: 'Tracked mood for 30 days',
    icon: '📊',
    earned: false
  }];
  const preferences = [{
    label: 'Daily Mood Reminders',
    enabled: true
  }, {
    label: 'Wellness Tips',
    enabled: true
  }, {
    label: 'Achievement Notifications',
    enabled: false
  }, {
    label: 'Weekly Summary',
    enabled: true
  }];
  return <div className="min-h-screen bg-gradient-calm p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-wellness bg-clip-text text-transparent">
              Your Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and track your wellness journey progress.
            </p>
          </div>
          <NotificationCenter />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar Section */}
                <div className="flex items-center gap-4 p-4 bg-gradient-wellness/5 rounded-lg border">
                  <MoodAvatar mood={currentMood} size="lg" />
                  <div>
                    <p className="font-medium">Current Mood Avatar</p>
                    <p className="text-sm text-muted-foreground">
                      Based on your latest mood: <span className="capitalize font-medium">{currentMood}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      value={profileData.display_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                      disabled={!isEditing} 
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={user?.email || ''} 
                      disabled 
                      className="mt-1" 
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <Button 
                        onClick={updateProfile} 
                        disabled={loading}
                        className="bg-gradient-wellness hover:shadow-glow transition-gentle"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)} 
                      disabled={!user}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {preferences.map((pref, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <span className="text-sm font-medium">{pref.label}</span>
                      <Switch
                        checked={pref.enabled}
                        onCheckedChange={() => togglePreference(pref.key)}
                        disabled={!user}
                      />
                    </div>
                  ))}
                </div>
                {!user && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Sign in to customize notification preferences.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Wellness Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-wellness bg-clip-text text-transparent">
                    {moodEntries.length > 0 ? Math.ceil((Date.now() - new Date(moodEntries[moodEntries.length - 1]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Days Active</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold">{moodEntries.length}</div>
                    <p className="text-xs text-muted-foreground">Mood Entries</p>
                  </div>
                  <div>
                    <div className="text-xl font-semibold">
                      {moodEntries.filter(entry => entry.mood_category === 'happy' || entry.mood_category === 'good').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Happy Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => <div key={index} className={`p-3 rounded-lg border transition-gentle ${achievement.earned ? 'bg-gradient-wellness/10 border-primary/20' : 'bg-muted/30 border-border/50 opacity-60'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{achievement.title}</h4>
                            {achievement.earned && <Badge variant="secondary" className="text-xs">
                                Earned
                              </Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2" disabled={userData.isGuest}>
                    <Shield className="h-4 w-4" />
                    Privacy Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Heart className="h-4 w-4" />
                    Export Data
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-2" 
                    disabled={!user}
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support */}
        <Card className="mt-8 bg-gradient-focus/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help you with any questions about your mental wellness journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline">
                Contact Support
              </Button>
              <Button variant="outline">
                View FAQ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Profile;