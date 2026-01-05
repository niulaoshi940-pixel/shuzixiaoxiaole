
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
 * Implements strict progression:
 * 1-20: Sum <= 10
 * 21-40: Sum <= 20
 * 41-60: Subtraction (Minuend <= 20)
 * 61-80: Sum <= 100
 * 81-100: Mixed Challenge
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
    // 81-100 Mixed
    const modes = [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION, GameMode.DIVISION];
    mode = modes[levelId % 4];
  }

  // Grid sizing: Higher levels have more blocks
  let gridSize = 4; // 16 blocks
  if (levelId > 10) gridSize = 5; // 25 blocks
  if (levelId > 30) gridSize = 6; // 36 blocks
  if (levelId > 50) gridSize = 7; // 49 blocks
  if (levelId > 75) gridSize = 8; // 64 blocks
  if (levelId > 90) gridSize = 9; // 81 blocks

  // Time limit (countdown) - gets tighter as levels progress
  const baseTime = 120;
  const timeLimit = Math.max(30, baseTime - (levelId * 0.9));

  // Special block rates increase with level
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
