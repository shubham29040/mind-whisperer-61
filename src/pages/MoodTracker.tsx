import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Calendar, TrendingUp, Smile, Heart } from 'lucide-react';

const MoodTracker = () => {
  // Sample mood data - in a real app, this would come from your database
  const weeklyMoodData = [
    { day: 'Mon', mood: 7, date: '2024-01-15' },
    { day: 'Tue', mood: 5, date: '2024-01-16' },
    { day: 'Wed', mood: 8, date: '2024-01-17' },
    { day: 'Thu', mood: 6, date: '2024-01-18' },
    { day: 'Fri', mood: 9, date: '2024-01-19' },
    { day: 'Sat', mood: 7, date: '2024-01-20' },
    { day: 'Sun', mood: 8, date: '2024-01-21' },
  ];

  const moodDistribution = [
    { mood: 'Happy', count: 12, color: '#22c55e' },
    { mood: 'Neutral', count: 8, color: '#64748b' },
    { mood: 'Anxious', count: 5, color: '#f59e0b' },
    { mood: 'Sad', count: 3, color: '#3b82f6' },
    { mood: 'Angry', count: 2, color: '#ef4444' },
  ];

  const recentEntries = [
    { date: '2024-01-21', mood: 'Happy', score: 8, note: 'Had a great conversation with the AI companion about mindfulness techniques.' },
    { date: '2024-01-20', mood: 'Neutral', score: 7, note: 'Feeling balanced today. The breathing exercises helped.' },
    { date: '2024-01-19', mood: 'Happy', score: 9, note: 'Wonderful day! Music recommendations were perfect.' },
    { date: '2024-01-18', mood: 'Anxious', score: 6, note: 'Work stress, but the AI provided helpful coping strategies.' },
  ];

  const getMoodColor = (mood: string) => {
    const colors = {
      Happy: 'bg-green-100 text-green-800 border-green-200',
      Neutral: 'bg-gray-100 text-gray-800 border-gray-200',
      Anxious: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Sad: 'bg-blue-100 text-blue-800 border-blue-200',
      Angry: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[mood as keyof typeof colors] || colors.Neutral;
  };

  const averageMood = weeklyMoodData.reduce((sum, day) => sum + day.mood, 0) / weeklyMoodData.length;

  return (
    <div className="min-h-screen bg-gradient-calm p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-wellness bg-clip-text text-transparent">
            Your Mood Journey
          </h1>
          <p className="text-muted-foreground">
            Track your emotional wellness over time and discover patterns in your mental health.
          </p>
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
                  <p className="text-2xl font-bold">{averageMood.toFixed(1)}/10</p>
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
                  <p className="text-2xl font-bold">30</p>
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
                  <p className="text-2xl font-bold">Friday</p>
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
                  <p className="text-2xl font-bold">7 days</p>
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
                Weekly Mood Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyMoodData}>
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
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Mood Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={moodDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {moodDistribution.map((entry, index) => (
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
                {moodDistribution.map((item, index) => (
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
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Mood Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntries.map((entry, index) => (
                <div key={index} className="p-4 border border-border/50 rounded-lg bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={getMoodColor(entry.mood)}>
                        {entry.mood}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{entry.date}</span>
                    </div>
                    <div className="text-sm font-semibold">
                      {entry.score}/10
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{entry.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-8">
          <Card className="bg-gradient-focus/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to continue your wellness journey?</h3>
              <p className="text-muted-foreground mb-4">
                Chat with our AI companion to add today's mood entry and receive personalized support.
              </p>
              <button className="bg-gradient-wellness text-primary-foreground px-6 py-2 rounded-lg hover:shadow-glow transition-gentle">
                Start New Chat
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;