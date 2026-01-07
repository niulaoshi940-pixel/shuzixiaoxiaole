
import React, { useState, useEffect, useCallback } from 'react';
import Home from './components/Home';
import MapView from './components/MapView';
import GameView from './components/GameView';
import { UserProgress } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'home' | 'map' | 'game'>('home');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('math_adventure_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 确保炸弹库存存在，若旧档没有则初始化
      if (parsed.inventory.bomb === undefined) parsed.inventory.bomb = 1;
      return parsed;
    }
    return {
      unlockedLevel: 1,
      stars: {},
      inventory: { hint: 3, freeze: 2, bomb: 1, refresh: 3 }
    };
  });

  useEffect(() => {
    localStorage.setItem('math_adventure_progress', JSON.stringify(progress));
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
    rewards: Partial<UserProgress['inventory']>,
    remainingInventory: UserProgress['inventory']
  ) => {
    setProgress(prev => {
      const newUnlocked = Math.max(prev.unlockedLevel, levelId + 1);
      const newStars = { ...prev.stars };
      newStars[levelId] = Math.max(prev.stars[levelId] || 0, stars);
      
      // 同步需累积的道具：炸弹和冻结
      const newInventory = { ...prev.inventory };
      newInventory.bomb = remainingInventory.bomb + (rewards.bomb || 0);
      newInventory.freeze = remainingInventory.freeze + (rewards.freeze || 0);
      
      // 提示和重组不累积，在 GameView 中已处理，这里保持原有库存或设为初始值
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
    <div className="h-full w-full select-none overflow-hidden relative">
      <div className="fixed bottom-32 left-4 z-[9999] pointer-events-none">
        <div className="bg-white/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 shadow-lg -rotate-12 floating flex items-center gap-1.5 transform scale-90 origin-left">
          <span className="text-xl">🐮🐮</span>
          <span className="text-xs font-black text-red-800 tracking-widest uppercase opacity-80">作品</span>
        </div>
      </div>

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
