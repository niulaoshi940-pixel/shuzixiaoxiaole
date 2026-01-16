
import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import MapView from './components/MapView';
import GameView from './components/GameView';
import { UserProgress } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'home' | 'map' | 'game'>('home');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('math_adventure_v2_progress');
    if (saved) return JSON.parse(saved);
    return {
      unlockedLevel: 1,
      stars: {},
      claimedChests: [],
      inventory: { hint: 3, freeze: 2, bomb: 2, refresh: 3 }
    };
  });

  useEffect(() => {
    localStorage.setItem('math_adventure_v2_progress', JSON.stringify(progress));
  }, [progress]);

  const handleLevelSelect = (levelId: number) => {
    if (levelId <= progress.unlockedLevel) {
      setSelectedLevel(levelId);
      setGameState('game');
    }
  };

  const handleGameComplete = (
    levelId: number, 
    stars: number, 
    rewards: any,
    remainingInventory: any,
    skipLevels: number = 0 // 新增跳关参数
  ) => {
    setProgress(prev => {
      // 计算解锁的新关卡：当前关卡 + 1 (正常通关) + 跳过的关卡数
      const nextLevelCalc = levelId + 1 + skipLevels;
      const newUnlocked = Math.max(prev.unlockedLevel, Math.min(100, nextLevelCalc)); // 不超过100关
      
      const newStars = { ...prev.stars };
      newStars[levelId] = Math.max(prev.stars[levelId] || 0, stars);
      
      // 如果跳关了，中间跳过的关卡默认给2星（作为奖励填充，避免地图看起来空缺）
      for (let i = 1; i <= skipLevels; i++) {
        const skippedId = levelId + i;
        if (skippedId < 100) {
           newStars[skippedId] = Math.max(newStars[skippedId] || 0, 2);
        }
      }

      const newInventory = { ...prev.inventory };
      newInventory.bomb = remainingInventory.bomb + (rewards.bomb || 0);
      newInventory.freeze = remainingInventory.freeze + (rewards.freeze || 0);
      newInventory.hint = 3; 
      newInventory.refresh = 3;

      return {
        ...prev,
        unlockedLevel: newUnlocked,
        stars: newStars,
        inventory: newInventory
      };
    });
    setGameState('map');
  };

  return (
    <div className="h-full w-full select-none overflow-hidden relative font-sans">
      {gameState === 'home' && <Home onStart={() => setGameState('map')} />}
      {gameState === 'map' && (
        <MapView 
          progress={progress} 
          onSelectLevel={handleLevelSelect} 
          onBack={() => setGameState('home')} 
        />
      )}
      {gameState === 'game' && (
        <GameView 
          levelId={selectedLevel} 
          inventory={progress.inventory}
          onComplete={handleGameComplete} 
          onQuit={() => setGameState('map')} 
        />
      )}
    </div>
  );
};

export default App;
