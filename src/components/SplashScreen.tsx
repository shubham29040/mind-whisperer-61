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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        {/* Animated Logo/Video would go here */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-wellness rounded-full animate-pulse opacity-60"></div>
          <div className="relative flex items-center justify-center w-full h-full">
            <div className="text-6xl animate-breathe">🧠</div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4 animate-fade-in">
          MindCare
        </h1>
        <p className="text-purple-200 text-lg animate-fade-in" style={{animationDelay: '0.5s'}}>
          Your Mental Wellness Companion
        </p>
        
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-300"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreenComponent;