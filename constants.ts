
import { GameMode, BlockType, LevelConfig } from './types';

export const TOTAL_LEVELS = 100;

export const ITEM_COSTS = {
  hint: 50,
  freeze: 80,
  bomb: 100,
  refresh: 60
};

/**
 * Generates dynamic level configuration based on levelId.
 */
export const getLevelConfig = (levelId: number): LevelConfig => {
  let mode = GameMode.ADDITION;
  
  if (levelId <= 20) {
    mode = GameMode.ADDITION; 
  } else if (levelId <= 40) {
    mode = GameMode.ADDITION; 
  } else if (levelId <= 60) {
    mode = GameMode.SUBTRACTION; 
  } else if (levelId <= 80) {
    mode = GameMode.ADDITION; 
  } else {
    const modes = [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION, GameMode.DIVISION];
    mode = modes[levelId % 4];
  }

  // Grid sizing
  let gridSize = 4;
  if (levelId > 10) gridSize = 5;
  if (levelId > 30) gridSize = 6;
  if (levelId > 50) gridSize = 7;
  if (levelId > 75) gridSize = 8;
  if (levelId > 90) gridSize = 9;

  /**
   * Linear decay for time limit:
   * Level 1 = 160s, Level 100 = 60s
   * Calculation: Start - (CurrentLevel - 1) * (TotalDrop / (TotalLevels - 1))
   */
  const timeLimit = 160 - (levelId - 1) * (100 / 99);

  const distractorRate = Math.min(0.5, (levelId / 180));
  
  const specialRates: any = {};
  if (levelId > 8) specialRates[BlockType.ICE] = Math.min(0.25, levelId * 0.006);
  if (levelId > 20) specialRates[BlockType.LOCKED] = Math.min(0.2, levelId * 0.005);
  if (levelId > 40) specialRates[BlockType.BOMB] = Math.min(0.15, levelId * 0.004);

  return {
    id: levelId,
    mode,
    gridSize,
    timeLimit,
    targetStars: [1000, 3000, 6000],
    distractorRate,
    specialRates
  };
};
