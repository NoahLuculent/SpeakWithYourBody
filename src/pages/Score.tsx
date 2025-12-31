import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Fireworks } from "@/components/Fireworks";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import { getGameState, clearGameState, CapturedImage } from "@/lib/gameStore";
import { Trophy, RotateCcw, Sparkles, Home } from "lucide-react";

const Score = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [timeBonus, setTimeBonus] = useState(0);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const gameState = getGameState();
    setScore(gameState.score);
    setTimeBonus(gameState.timeBonus);
    setCapturedImages(gameState.capturedImages);

    // Stop confetti after a few seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handlePlayAgain = () => {
    const modelUrl = getGameState().modelUrl;
    clearGameState();
    saveGameState({ modelUrl });
    navigate("/game");
  };

  const handleGoHome = () => {
    clearGameState();
    navigate("/");
  };

  // Helper to save game state with model URL preserved
  const saveGameState = (state: { modelUrl: string }) => {
    localStorage.setItem(
      "teachable-machine-game-state",
      JSON.stringify({
        ...state,
        score: 0,
        timeBonus: 0,
        capturedImages: [],
        labels: [],
        usedLabels: [],
      })
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <Fireworks />
      <ConfettiEffect active={showConfetti} />

      <div className="relative z-10 flex flex-col items-center min-h-screen py-12 px-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-sparkle" />
            <span className="text-sm font-medium tracking-widest text-primary uppercase">
              Game Complete
            </span>
            <Sparkles className="w-6 h-6 text-primary animate-sparkle" />
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-gold-gradient mb-2">
            Congratulations!
          </h1>
        </div>

        {/* Captured Images Gallery */}
        {capturedImages.length > 0 && (
          <div
            className="w-full max-w-4xl mb-8 animate-fade-in text-center"
            style={{ animationDelay: "0.2s" }}
          >
            <h2 className="font-display text-2xl font-semibold text-foreground text-center mb-6">
              Your Poses
            </h2>
            <div className="inline-grid grid-cols-4 gap-4">
              {capturedImages.map((capture, index) => (
                <div
                  key={index}
                  className="glass-card p-3 rounded-xl animate-scale-in"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-2">
                    <img
                      src={capture.imageData}
                      alt={capture.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-center text-sm font-medium text-foreground truncate">
                    {capture.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score Display */}
        <div
          className="glass-card p-8 rounded-2xl text-center gold-glow animate-scale-in"
          style={{ animationDelay: "0.4s" }}
        >
          <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />

          <p className="text-muted-foreground text-lg mb-2">Final Score</p>
          <p className="font-display text-6xl md:text-7xl font-bold text-gold-gradient mb-4">
            {score.toFixed(1)}
          </p>

          {timeBonus > 0 && (
            <p className="text-sm text-muted-foreground">
              Includes +{timeBonus.toFixed(1)} time bonus!
            </p>
          )}

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-muted-foreground">
              Poses matched:{" "}
              <span className="text-primary font-bold">
                {capturedImages.length}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 mt-8 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <Button variant="gold" size="xl" onClick={handlePlayAgain}>
            <RotateCcw className="w-5 h-5" />
            Play Again
          </Button>
          <Button variant="outline" size="xl" onClick={handleGoHome}>
            <Home className="w-5 h-5" />
            New Model
          </Button>
        </div>

        {/* Year decoration */}
        <div className="fixed bottom-0 left-0 right-0 text-center pb-4 pointer-events-none">
          <span className="font-display text-[8rem] md:text-[12rem] font-bold text-primary/5 select-none">
            2026
          </span>
        </div>
      </div>
    </div>
  );
};

export default Score;
