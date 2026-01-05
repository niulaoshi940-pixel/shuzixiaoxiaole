
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
      // Ensure refresh exists for migrations
      if (!parsed.inventory.refresh) parsed.inventory.refresh = 3;
      return parsed;
    }
    return {
      unlockedLevel: 1,
      stars: {},
      inventory: { hint: 3, freeze: 2, bomb: 2, refresh: 3 }
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

  const handleGameComplete = (levelId: number, stars: number, rewards: Partial<UserProgress['inventory']>) => {
    setProgress(prev => {
      const newUnlocked = Math.max(prev.unlockedLevel, levelId + 1);
      const newStars = { ...prev.stars };
      newStars[levelId] = Math.max(prev.stars[levelId] || 0, stars);
      
      const newInventory = { ...prev.inventory };
      if (rewards.hint) newInventory.hint += rewards.hint;
      if (rewards.freeze) newInventory.freeze += rewards.freeze;
      if (rewards.bomb) newInventory.bomb += rewards.bomb;
      if (rewards.refresh) newInventory.refresh += rewards.refresh;

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
    <div className="h-full w-full select-none overflow-hidden">
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
