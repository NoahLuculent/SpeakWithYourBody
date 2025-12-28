import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Fireworks } from "@/components/Fireworks";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import { getGameState, saveGameState, addCapturedImage } from "@/lib/gameStore";
import { Progress } from "@/components/ui/progress";
import { Clock, Trophy, Target } from "lucide-react";

// Use CDN-loaded tmPose from window
declare global {
  interface Window {
    tmPose?: any;
  }
}

const ensureTrailingSlash = (url: string) =>
  url.endsWith("/") ? url : `${url}/`;

const waitForTmPose = async (timeoutMs = 8000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (typeof window !== "undefined" && window.tmPose) return window.tmPose;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
};

const GAME_DURATION = 180; // 3 minutes in seconds
const THRESHOLD = 0.7; // 70%
const CAPTURE_DISPLAY_TIME = 3000; // 3 seconds

const Game = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [model, setModel] = useState<any>(null);
  const [webcam, setWebcam] = useState<any>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [usedLabels, setUsedLabels] = useState<string[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const animationFrameRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();
  const captureTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize model and webcam
  useEffect(() => {
    const initGame = async () => {
      const gameState = getGameState();

      if (!gameState.modelUrl) {
        navigate("/");
        return;
      }

      try {
        setIsLoading(true);

        const tmPose = await waitForTmPose();
        if (!tmPose) {
          throw new Error(
            "tmPose is not available. CDN scripts failed to load."
          );
        }

        // Load the model
        const baseUrl = ensureTrailingSlash(gameState.modelUrl);
        const modelURL = baseUrl + "model.json";
        const metadataURL = baseUrl + "metadata.json";

        const loadedModel = await tmPose.load(modelURL, metadataURL);
        setModel(loadedModel);

        // Get labels from model
        const classLabels = loadedModel.getClassLabels();
        setLabels(classLabels);
        saveGameState({ labels: classLabels });

        // Setup webcam
        const size = 400;
        const flip = true;
        const webcamInstance = new tmPose.Webcam(size, size, flip);
        await webcamInstance.setup();
        await webcamInstance.play();

        // Append webcam to container - use webcam element directly
        if (webcamRef.current) {
          webcamRef.current.innerHTML = "";
          // tmPose.Webcam creates a canvas element after setup/play
          if (webcamInstance.canvas) {
            webcamInstance.canvas.style.width = "100%";
            webcamInstance.canvas.style.height = "100%";
            webcamInstance.canvas.style.objectFit = "cover";
            webcamRef.current.appendChild(webcamInstance.canvas);
          } else if (webcamInstance.webcam) {
            // Fallback: use underlying video element
            webcamInstance.webcam.style.width = "100%";
            webcamInstance.webcam.style.height = "100%";
            webcamInstance.webcam.style.objectFit = "cover";
            webcamRef.current.appendChild(webcamInstance.webcam);
          }
        }

        setWebcam(webcamInstance);

        setIsLoading(false);
        setGameActive(true);
      } catch (err) {
        console.error("Error initializing game:", err);
        setError("Failed to load model. Please check the URL and try again.");
        setIsLoading(false);
      }
    };

    initGame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
      webcam?.stop();
    };
  }, [navigate]);

  // Game timer
  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameActive]);

  // Prediction loop
  const predict = useCallback(async () => {
    if (!model || !webcam || !gameActive || !selectedLabel) return;

    webcam.update();
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const predictions = await model.predict(posenetOutput);

    // Draw pose on canvas
    if (canvasRef.current && pose) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 400, 400);

        // Draw keypoints
        if (pose.keypoints) {
          pose.keypoints.forEach((keypoint) => {
            if (keypoint.score && keypoint.score > 0.5) {
              ctx.beginPath();
              ctx.arc(
                keypoint.position.x,
                keypoint.position.y,
                5,
                0,
                2 * Math.PI
              );
              ctx.fillStyle = "hsl(45, 93%, 58%)";
              ctx.fill();
            }
          });

          // Draw skeleton lines between adjacent keypoints
          const adjacentPairs: [number, number][] = [
            [5, 6],
            [5, 7],
            [7, 9],
            [6, 8],
            [8, 10],
            [5, 11],
            [6, 12],
            [11, 12],
            [11, 13],
            [13, 15],
            [12, 14],
            [14, 16],
          ];
          adjacentPairs.forEach(([i, j]) => {
            const kp1 = pose.keypoints[i];
            const kp2 = pose.keypoints[j];
            if (
              kp1?.score &&
              kp1.score > 0.5 &&
              kp2?.score &&
              kp2.score > 0.5
            ) {
              ctx.beginPath();
              ctx.moveTo(kp1.position.x, kp1.position.y);
              ctx.lineTo(kp2.position.x, kp2.position.y);
              ctx.strokeStyle = "hsl(45, 93%, 58%)";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
        }
      }
    }

    // Find prediction for selected label
    const selectedPrediction = predictions.find(
      (p) => p.className === selectedLabel
    );
    if (selectedPrediction) {
      const probability = selectedPrediction.probability;
      setCurrentPrediction(probability);

      // Check threshold
      if (probability >= THRESHOLD && !capturedImage) {
        handleThresholdReached();
      }
    }

    animationFrameRef.current = requestAnimationFrame(predict);
  }, [model, webcam, gameActive, selectedLabel, capturedImage]);

  useEffect(() => {
    if (gameActive && selectedLabel && !capturedImage) {
      animationFrameRef.current = requestAnimationFrame(predict);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [predict, gameActive, selectedLabel, capturedImage]);

  const handleThresholdReached = () => {
    if (!webcam || !selectedLabel) return;

    // Capture image
    const canvas = webcam.canvas;
    const imageData = canvas.toDataURL("image/png");

    // Save captured image
    addCapturedImage(selectedLabel, imageData);
    setCapturedImage(imageData);
    setShowSuccess(true);
    setShowConfetti(true);

    // Update score
    setScore((prev) => prev + 1);

    // Mark label as used
    setUsedLabels((prev) => [...prev, selectedLabel]);

    // Clear selection after display time
    captureTimeoutRef.current = setTimeout(() => {
      setCapturedImage(null);
      setSelectedLabel(null);
      setShowConfetti(false);

      // Check if all labels are used
      const newUsedLabels = [...usedLabels, selectedLabel];
      if (newUsedLabels.length >= labels.length) {
        endGame();
      }
    }, CAPTURE_DISPLAY_TIME);
  };

  const endGame = () => {
    setGameActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Calculate time bonus (0.1 points per 10 seconds remaining)
    const timeBonus = Math.floor(timeLeft / 10) * 0.1;
    const finalScore = score + timeBonus;

    saveGameState({
      score: finalScore,
      timeBonus,
    });

    navigate("/score");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLabelSelect = (label: string) => {
    if (usedLabels.includes(label) || capturedImage) return;
    setSelectedLabel(label);
    setCurrentPrediction(0);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md">
          <h2 className="font-display text-2xl font-bold text-destructive mb-4">
            Error
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="gold" onClick={() => navigate("/")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <Fireworks />
      <SuccessAnimation
        show={showSuccess}
        onComplete={() => setShowSuccess(false)}
      />
      <ConfettiEffect active={showConfetti} />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          {/* Score Box */}
          <div className="glass-card px-6 py-3 rounded-xl flex items-center gap-3">
            <Trophy className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Score
              </p>
              <p className="text-2xl font-bold text-primary">{score}</p>
            </div>
          </div>

          {/* Timer Box */}
          <div className="glass-card px-6 py-3 rounded-xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-foreground" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Time
              </p>
              <p
                className={`text-2xl font-bold ${
                  timeLeft <= 30 ? "text-destructive" : "text-foreground"
                }`}
              >
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-24 pb-8 px-4">
        {isLoading ? (
          <div className="glass-card p-12 rounded-2xl text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading model...</p>
          </div>
        ) : (
          <>
            {/* Webcam Container */}
            <div className="relative mb-6">
              <div className="glass-card p-2 rounded-2xl gold-glow">
                <div className="relative w-[400px] h-[400px] rounded-xl overflow-hidden bg-midnight-light">
                  {/* Webcam feed */}
                  <div ref={webcamRef} className="absolute inset-0" />

                  {/* Pose overlay */}
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="absolute inset-0 pointer-events-none"
                  />

                  {/* Captured image overlay */}
                  {capturedImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 animate-fade-in">
                      <img
                        src={capturedImage}
                        alt="Captured pose"
                        className="max-w-full max-h-full rounded-lg shadow-2xl"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* No label selected prompt */}
              {!selectedLabel && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-2xl">
                  <div className="text-center p-6">
                    <Target className="w-12 h-12 text-primary mx-auto mb-3" />
                    <p className="text-lg font-semibold text-foreground">
                      Select a pose to match!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {selectedLabel && (
              <div className="w-full max-w-[400px] mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {selectedLabel}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {Math.round(currentPrediction * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <Progress value={currentPrediction * 100} className="h-4" />
                  {/* Threshold line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                    style={{ left: `${THRESHOLD * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Reach 70% to capture!
                </p>
              </div>
            )}

            {/* Label Selection */}
            <div className="w-full max-w-2xl">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Choose a pose:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {labels.map((label) => {
                  const isUsed = usedLabels.includes(label);
                  const isSelected = selectedLabel === label;

                  return (
                    <Button
                      key={label}
                      variant={
                        isUsed
                          ? "labelUsed"
                          : isSelected
                          ? "labelSelected"
                          : "label"
                      }
                      size="lg"
                      disabled={isUsed || !!capturedImage}
                      onClick={() => handleLabelSelect(label)}
                      className="min-w-[120px]"
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Game;
