import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Fireworks } from '@/components/Fireworks';
import { saveGameState, clearGameState } from '@/lib/gameStore';
import { Sparkles, Play, Camera } from 'lucide-react';

const Index = () => {
  const [modelUrl, setModelUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    if (!modelUrl.trim()) {
      setError('Please enter a valid model URL');
      return;
    }

    // Validate URL format
    if (!modelUrl.includes('teachablemachine.withgoogle.com')) {
      setError('Please enter a valid Teachable Machine model URL');
      return;
    }

    // Clear previous game state and save new model URL
    clearGameState();
    saveGameState({ modelUrl: modelUrl.trim() });
    navigate('/game');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Fireworks />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Title Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-sparkle" />
            <span className="text-sm font-medium tracking-widest text-primary uppercase">
              Welcome to 2025
            </span>
            <Sparkles className="w-8 h-8 text-primary animate-sparkle" />
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 text-gold-gradient">
            Pose Challenge
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            Strike a pose, beat the clock, and celebrate the New Year!
          </p>
        </div>

        {/* Input Card */}
        <div className="glass-card rounded-2xl p-8 w-full max-w-lg animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-6">
            <Camera className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Enter Your Model
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Teachable Machine Pose Model URL
              </label>
              <Input
                type="url"
                placeholder="https://teachablemachine.withgoogle.com/models/..."
                value={modelUrl}
                onChange={(e) => {
                  setModelUrl(e.target.value);
                  setError('');
                }}
                className="h-12 bg-secondary/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </div>

            <Button
              variant="gold"
              size="xl"
              className="w-full shimmer"
              onClick={handleStart}
            >
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Create your pose model at{' '}
              <a
                href="https://teachablemachine.withgoogle.com/train/pose"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Teachable Machine
              </a>
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {[
            { step: '1', title: 'Train', desc: 'Create poses in Teachable Machine' },
            { step: '2', title: 'Upload', desc: 'Paste your model URL above' },
            { step: '3', title: 'Play', desc: 'Match poses before time runs out!' },
          ].map((item) => (
            <div key={item.step} className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center mx-auto mb-2">
                {item.step}
              </div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Year decoration */}
      <div className="fixed bottom-0 left-0 right-0 text-center pb-8 pointer-events-none">
        <span className="font-display text-[12rem] md:text-[20rem] font-bold text-primary/5 select-none">
          2025
        </span>
      </div>
    </div>
  );
};

export default Index;
