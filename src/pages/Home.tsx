import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Heart, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-wellness.jpg';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: "AI Companion",
      description: "Chat with our empathetic AI that understands your emotions and provides personalized support."
    },
    {
      icon: Heart,
      title: "Emotion Detection",
      description: "Advanced sentiment analysis detects your mood and provides tailored wellness recommendations."
    },
    {
      icon: TrendingUp,
      title: "Mood Tracking",
      description: "Track your emotional journey over time with beautiful visualizations and insights."
    },
    {
      icon: Users,
      title: "Anonymous Support",
      description: "Get help without signing up - your privacy and comfort are our priorities."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-calm">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-wellness bg-clip-text text-transparent">
                Your Mental Wellness Journey Starts Here
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Meet MindCare - an AI-powered companion that understands your emotions, 
                provides personalized support, and helps you track your mental wellness journey.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-gradient-wellness hover:shadow-glow transition-gentle px-8 py-3"
                  onClick={() => navigate('/chat')}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Start Chatting
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary/30 hover:bg-primary/5 px-8 py-3"
                  onClick={() => navigate('/chat?guest=true')}
                >
                  Continue as Guest
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                No signup required • Private & Secure • Available 24/7
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-focus rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <img 
                src={heroImage}
                alt="Mental wellness and serenity"
                className="relative rounded-3xl shadow-card w-full h-auto animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              How MindCare Supports Your Mental Health
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Combining advanced AI with evidence-based therapeutic approaches to provide you with personalized mental health support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-soft transition-gentle border-border/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-wellness rounded-full flex items-center justify-center group-hover:shadow-glow transition-gentle">
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-focus/10">
        <div className="container mx-auto px-6">
          <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to begin your wellness journey?</h3>
              <p className="text-muted-foreground mb-6">
                Start chatting with our AI companion today and take the first step towards better mental health.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  size="lg"
                  className="bg-gradient-wellness hover:shadow-glow transition-gentle"
                  onClick={() => navigate('/chat')}
                >
                  Get Started Now
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/mood-tracker')}
                >
                  View Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;