import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Heart, TrendingUp, Users } from 'lucide-react';
import heroImage from '@/assets/hero-wellness.jpg';

const Home = () => {
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
      title: "Secure Support",
      description: "Get professional mental health support in a private and secure environment."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center lg:text-left space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                Your Mental Wellness Journey Starts Here
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Meet MindCare - an AI-powered companion that understands your emotions, provides personalized support, and helps you track your mental wellness journey.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/chat">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 px-6 md:px-8 py-3">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Start Chatting
                  </Button>
                </Link>
                <Link to="/mood-tracker">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 md:px-8 py-3">
                    Track Mood
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground">
                Private & Secure • Available 24/7 • Evidence-Based Support
              </p>
            </div>

            <div className="relative">
              <div className="aspect-square lg:aspect-auto lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage}
                  alt="Mental wellness and serenity"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 lg:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              How MindCare Supports Your Mental Health
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Combining advanced AI with evidence-based therapeutic approaches for personalized mental health support.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <Icon className="h-6 md:h-8 w-6 md:w-8 text-white" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">{feature.title}</h3>
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
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-border/50">
            <CardContent className="p-6 md:p-8 text-center">
              <h3 className="text-xl md:text-2xl font-bold mb-4">Ready to begin your wellness journey?</h3>
              <p className="text-muted-foreground mb-6">
                Start chatting with our AI companion today and take the first step towards better mental health.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/chat">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                    Get Started Now
                  </Button>
                </Link>
                <Link to="/mood-tracker">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View Demo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;