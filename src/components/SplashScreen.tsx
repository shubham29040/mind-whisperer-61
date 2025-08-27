import { useEffect, useState } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';

const SplashScreenComponent = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      SplashScreen.hide();
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent">
      <div className="text-center">
        {/* Animated mental health themed logo */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-4 bg-gradient-to-br from-accent/30 to-primary/30 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
          <div className="relative flex items-center justify-center w-full h-full">
            <div className="text-6xl animate-breathe filter drop-shadow-lg">🧠</div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent/60 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-secondary/60 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        <h1 className="text-5xl font-bold text-foreground mb-4 animate-fade-in bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          MindCare
        </h1>
        <p className="text-muted-foreground text-xl animate-fade-in font-medium" style={{animationDelay: '0.5s'}}>
          Your AI Mental Wellness Companion
        </p>
        <p className="text-muted-foreground/80 text-sm mt-2 animate-fade-in" style={{animationDelay: '0.8s'}}>
          Powered by Advanced AI • Safe & Confidential
        </p>
        
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
        
        <div className="mt-6 text-xs text-muted-foreground/60 animate-fade-in" style={{animationDelay: '1.2s'}}>
          Initializing secure connection...
        </div>
      </div>
    </div>
  );
};

export default SplashScreenComponent;