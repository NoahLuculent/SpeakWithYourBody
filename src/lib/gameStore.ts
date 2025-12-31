// Game state store using localStorage for persistence across pages

export interface CapturedImage {
  label: string;
  imageData: string;
  timestamp: number;
}

export interface GameState {
  modelUrl: string;
  score: number;
  timeBonus: number;
  capturedImages: CapturedImage[];
  labels: string[];
  usedLabels: string[];
}

const STORAGE_KEY = 'teachable-machine-game-state';

export const saveGameState = (state: Partial<GameState>) => {
  const existing = getGameState();
  const newState = { ...existing, ...state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
};

export const getGameState = (): GameState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    modelUrl: '',
    score: 0,
    timeBonus: 0,
    capturedImages: [],
    labels: [],
    usedLabels: [],
  };
};

export const clearGameState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const addCapturedImage = (label: string, imageData: string): boolean => {
  const state = getGameState();
  // Prevent duplicate captures for the same label
  if (state.usedLabels.includes(label)) {
    return false;
  }
  state.capturedImages.push({
    label,
    imageData,
    timestamp: Date.now(),
  });
  state.usedLabels.push(label);
  state.score += 1;
  saveGameState(state);
  return true;
};
