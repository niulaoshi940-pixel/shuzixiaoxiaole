
export enum GameMode {
  ADDITION = 'addition',
  SUBTRACTION = 'subtraction',
  MULTIPLICATION = 'multiplication',
  DIVISION = 'division'
}

export enum BlockType {
  STANDARD = 'standard',
  ICE = 'ice',
  LOCKED = 'locked',
  BOMB = 'bomb'
}

export interface Block {
  id: string;
  value: number;
  type: BlockType;
  isRemoved: boolean;
  isSelected: boolean;
  lockCount: number; // For LOCKED type
  bombTimer?: number; // For BOMB type (countdown steps)
  isFiller?: boolean; // New: For blocks that just fill space (ice blocks in "empty" spots)
}

export interface LevelConfig {
  id: number;
  mode: GameMode;
  maxVal: number; // New: Maximum value for math operations
  gridSize: number;
  timeLimit: number;
  targetStars: number[];
  distractorRate: number; // 0.0 to 1.0
  specialRates: {
    [key in BlockType]?: number;
  };
}

export interface UserProgress {
  unlockedLevel: number;
  stars: { [levelId: number]: number };
  inventory: {
    hint: number;
    freeze: number;
    bomb: number;
    refresh: number;
  };
}
