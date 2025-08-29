import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Calendar, TrendingUp, Smile, Heart, RefreshCw, MessageCircle } from 'lucide-react';
import { useRealtimeMoodAnalytics } from '@/hooks/useRealtimeMoodAnalytics';
import { useRealtimeStats } from '@/hooks/useRealtimeStats';

const MoodTracker = () => {
  const { analytics, refreshAnalytics } = useRealtimeMoodAnalytics();
  const { stats } = useRealtimeStats();

  const getMoodColor = (mood: string) => {
    const colors = {
      Happy: 'bg-green-100 text-green-800 border-green-200',
      Neutral: 'bg-gray-100 text-gray-800 border-gray-200',
      Anxious: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Sad: 'bg-blue-100 text-blue-800 border-blue-200',
      Angry: 'bg-red-100 text-red-800 border-red-200',
      Calm: 'bg-blue-100 text-blue-800 border-blue-200',
      Excited: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[mood as keyof typeof colors] || colors.Neutral;
  };

  return (
    <div className="min-h-screen bg-gradient-calm p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-wellness bg-clip-text text-transparent">
                Real-time Mood Analytics
              </h1>
              <p className="text-muted-foreground">
                Track your emotional wellness in real-time based on your chat conversations.
              </p>
            </div>
            <Button 
              onClick={refreshAnalytics}
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-wellness rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Mood</p>
                  <p className="text-2xl font-bold">{analytics.insights.averageMood}/10</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-focus rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Tracked</p>
                  <p className="text-2xl font-bold">{analytics.insights.totalDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Smile className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Day</p>
                  <p className="text-2xl font-bold">{analytics.insights.bestDay}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold">{analytics.insights.streak} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Mood Trend */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Real-time Weekly Mood Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: 'hsl(var(--primary-glow))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Based on real-time analysis of your chat messages
              </p>
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Live Mood Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.moodDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {analytics.moodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-4">
                {analytics.moodDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.mood} ({item.count})
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Updates automatically from your conversations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Recent Chat-Based Mood Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.moodHistory.slice(-4).reverse().map((entry, index) => (
                <div key={index} className="p-4 border border-border/50 rounded-lg bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={getMoodColor(entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1))}>
                        {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{entry.date}</span>
                    </div>
                    <div className="text-sm font-semibold">
                      {entry.score}/10
                    </div>
                  </div>
                  <p className="text-sm text-foreground">
                    Analyzed from {entry.messages} chat messages - showing emotional patterns detected in your conversations.
                  </p>
                </div>
              ))}
              {analytics.moodHistory.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Start chatting to see your mood analysis here!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-8">
          <Card className="bg-gradient-focus/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Keep your wellness journey active!</h3>
              <p className="text-muted-foreground mb-4">
                Chat with our AI companion to continue real-time mood tracking and receive personalized support.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  className="bg-gradient-wellness text-primary-foreground hover:shadow-glow transition-gentle"
                  onClick={() => window.location.href = '/chat'}
                >
                  Start New Chat
                </Button>
                <Button 
                  variant="outline"
                  onClick={refreshAnalytics}
                >
                  Refresh Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;