import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MoodAvatarProps {
  mood: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getMoodEmoji = (mood: string): string => {
  switch (mood.toLowerCase()) {
    case 'happy':
    case 'great':
    case 'excellent':
      return '😊';
    case 'good':
    case 'positive':
      return '🙂';
    case 'neutral':
    case 'okay':
      return '😐';
    case 'sad':
    case 'down':
    case 'low':
      return '😔';
    case 'anxious':
    case 'worried':
    case 'stressed':
      return '😰';
    case 'angry':
    case 'frustrated':
    case 'mad':
      return '😠';
    case 'excited':
    case 'energetic':
      return '😃';
    case 'calm':
    case 'peaceful':
      return '😌';
    case 'confused':
    case 'uncertain':
      return '😕';
    case 'tired':
    case 'exhausted':
      return '😴';
    default:
      return '🙂';
  }
};

const getSizeClasses = (size: string): string => {
  switch (size) {
    case 'sm':
      return 'h-8 w-8';
    case 'lg':
      return 'h-16 w-16';
    default:
      return 'h-10 w-10';
  }
};

export const MoodAvatar = ({ mood, size = 'md', className = '' }: MoodAvatarProps) => {
  const emoji = getMoodEmoji(mood);
  const sizeClasses = getSizeClasses(size);

  return (
    <Avatar className={`${sizeClasses} ${className} bg-gradient-wellness/20 border-2 border-primary/20`}>
      <AvatarFallback className="bg-gradient-wellness/10 text-2xl">
        {emoji}
      </AvatarFallback>
    </Avatar>
  );
};