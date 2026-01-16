
export enum GameMode {
  ADDITION = 'addition',
  SUBTRACTION = 'subtraction',
  MULTIPLICATION = 'multiplication',
  DIVISION = 'division',
  TARGET_SUM = 'target_sum'
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
  lockCount: number;
  bombTimer?: number;
  isFiller?: boolean;
}

export interface LevelConfig {
  id: number;
  mode: GameMode;
  maxVal: number;
  gridSize: number;
  timeLimit: number;
  targetStars: number[];
  distractorRate: number;
  specialRates: {
    [key in BlockType]?: number;
  };
}

export interface UserProgress {
  unlockedLevel: number;
  stars: { [levelId: number]: number };
  claimedChests: number[]; // 已领取的宝箱关卡ID
  inventory: {
    hint: number;
    freeze: number;
    bomb: number;
    refresh: number;
  };
}
