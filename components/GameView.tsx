
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Block, BlockType, GameMode, LevelConfig } from '../types';
import { getLevelConfig, ITEM_COSTS } from '../constants';

interface GameViewProps {
  levelId: number;
  inventory: { hint: number; freeze: number; bomb: number; refresh: number };
  onComplete: (levelId: number, stars: number, rewards: any) => void;
  onQuit: () => void;
}

const GameView: React.FC<GameViewProps> = ({ levelId, inventory, onComplete, onQuit }) => {
  const config = useMemo(() => getLevelConfig(levelId), [levelId]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [isFrozen, setIsFrozen] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Generate a math triple strictly adhering to the current level bracket's rules
  const generateTriple = useCallback(() => {
    let a, b, c;
    let maxVal = 10;
    
    if (levelId <= 20) {
      maxVal = 10;
    } else if (levelId <= 40) {
      maxVal = 20;
    } else if (levelId <= 60) {
      maxVal = 20;
    } else if (levelId <= 80) {
      maxVal = 100;
    } else {
      maxVal = 100;
    }

    if (config.mode === GameMode.ADDITION) {
      c = Math.floor(Math.random() * (maxVal - 1)) + 2; 
      a = Math.floor(Math.random() * (c - 1)) + 1;
      b = c - a;
    } else if (config.mode === GameMode.SUBTRACTION) {
      a = Math.floor(Math.random() * (maxVal - 1)) + 2;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      c = a - b;
    } else if (config.mode === GameMode.MULTIPLICATION) {
      const multMax = Math.max(5, Math.floor(Math.sqrt(maxVal)));
      a = Math.floor(Math.random() * (multMax - 1)) + 2;
      const possibleB = Math.floor(maxVal / a);
      b = Math.floor(Math.random() * (possibleB > 1 ? possibleB - 1 : 1)) + 1;
      c = a * b;
    } else {
      c = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
      a = c * b;
      if (a > maxVal) {
          a = Math.floor(Math.random() * (maxVal - 2)) + 2;
          const divList = [];
          for(let i=1; i<=a; i++) if(a%i===0) divList.push(i);
          b = divList[Math.floor(Math.random() * divList.length)];
          c = a / b;
      }
    }
    return [a, b, c];
  }, [config.mode, levelId]);

  const initBoard = useCallback(() => {
    const totalGridSlots = config.gridSize * config.gridSize;
    // The number of interactive blocks MUST be a multiple of 3
    const playableCount = Math.floor(totalGridSlots / 3) * 3;
    const fillerCount = totalGridSlots - playableCount;
    
    const newBlocks: Block[] = [];

    // 1. Generate Interactive Triples
    // We decide how many triples vs distractors based on level
    const triplesCount = Math.floor(playableCount / 3);
    const distractorTriples = Math.floor(triplesCount * config.distractorRate);
    const validTriples = triplesCount - distractorTriples;

    // Add valid triples
    for (let i = 0; i < validTriples; i++) {
      const [a, b, c] = generateTriple();
      [a, b, c].forEach(val => {
        const typeRoll = Math.random();
        let type = BlockType.STANDARD;
        if (typeRoll < (config.specialRates[BlockType.ICE] || 0)) type = BlockType.ICE;
        else if (typeRoll < (config.specialRates[BlockType.LOCKED] || 0) + (config.specialRates[BlockType.ICE] || 0)) type = BlockType.LOCKED;
        else if (typeRoll < (config.specialRates[BlockType.BOMB] || 0) + (config.specialRates[BlockType.LOCKED] || 0) + (config.specialRates[BlockType.ICE] || 0)) type = BlockType.BOMB;

        newBlocks.push({
          id: Math.random().toString(36).substr(2, 9),
          value: val,
          type,
          isRemoved: false,
          isSelected: false,
          lockCount: type === BlockType.LOCKED ? 2 : 0,
          bombTimer: type === BlockType.BOMB ? 10 : undefined
        });
      });
    }

    // Add distractors (still in groups of 3 to keep total multiple of 3)
    const maxDistVal = levelId <= 20 ? 10 : (levelId <= 60 ? 25 : 100);
    for (let i = 0; i < distractorTriples; i++) {
      for (let j = 0; j < 3; j++) {
        newBlocks.push({
          id: Math.random().toString(36).substr(2, 9),
          value: Math.floor(Math.random() * maxDistVal) + 1,
          type: BlockType.STANDARD,
          isRemoved: false,
          isSelected: false,
          lockCount: 0
        });
      }
    }

    // 2. Add Fillers (Ice blocks that occupy "empty" space)
    for (let i = 0; i < fillerCount; i++) {
      newBlocks.push({
        id: `filler-${i}-${Math.random()}`,
        value: 0,
        type: BlockType.ICE,
        isRemoved: false,
        isSelected: false,
        lockCount: 0,
        isFiller: true
      });
    }

    setBlocks(newBlocks.sort(() => Math.random() - 0.5));
  }, [config, generateTriple, levelId]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }
    if (isFrozen || isGameOver) return;

    // Use 100ms interval for precision countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 0.1;
        return next <= 0 ? 0 : next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [timeLeft, isFrozen, isGameOver]);

  const handleBlockClick = (block: Block) => {
    if (block.isRemoved || block.type === BlockType.ICE || isGameOver || block.isFiller) return;

    if (selectedIds.includes(block.id)) {
      setSelectedIds(prev => prev.filter(id => id !== block.id));
      return;
    }

    if (selectedIds.length < 3) {
      const nextSelected = [...selectedIds, block.id];
      setSelectedIds(nextSelected);

      if (nextSelected.length === 3) {
        checkMatch(nextSelected);
      }
    }
  };

  const checkMatch = (ids: string[]) => {
    const selectedBlocks = ids.map(id => blocks.find(b => b.id === id)!);
    const vals = selectedBlocks.map(b => b.value);
    const [a, b, c] = vals;

    let isMatch = false;
    if (config.mode === GameMode.ADDITION) isMatch = a + b === c;
    else if (config.mode === GameMode.SUBTRACTION) isMatch = a - b === c;
    else if (config.mode === GameMode.MULTIPLICATION) isMatch = a * b === c;
    else if (config.mode === GameMode.DIVISION) isMatch = b !== 0 && a / b === c;

    if (isMatch) {
      const newBlocks = blocks.map(b => {
        if (ids.includes(b.id)) {
          if (b.type === BlockType.LOCKED && b.lockCount > 1) {
            return { ...b, lockCount: b.lockCount - 1 };
          }
          return { ...b, isRemoved: true };
        }
        return b;
      });

      // Special logic: Melting adjacent ice when a match occurs (including filler ice)
      const finalBlocks = newBlocks.map((b) => {
          if (b.type === BlockType.ICE) {
              // High chance to melt ice near a match
              if (Math.random() > 0.4) {
                  // If it's a filler, it just disappears. If it's interactive ice, it becomes standard.
                  if (b.isFiller) return { ...b, isRemoved: true };
                  return { ...b, type: BlockType.STANDARD };
              }
          }
          return b;
      });

      setBlocks(finalBlocks);
      setSelectedIds([]);
      setScore(prev => prev + 100 + (combo * 20));
      setCombo(prev => prev + 1);
      
      // Check if all interactive blocks are gone
      if (finalBlocks.every(b => b.isRemoved || b.isFiller)) {
          finishLevel();
      }
    } else {
      setTimeout(() => {
        setSelectedIds([]);
        setCombo(0);
      }, 500);
    }
  };

  const finishLevel = () => {
      let starCount = 1;
      if (timeLeft > config.timeLimit * 0.6) starCount = 3;
      else if (timeLeft > config.timeLimit * 0.3) starCount = 2;

      const rewards = {
          hint: levelId % 5 === 0 ? 1 : 0,
          freeze: levelId % 10 === 0 ? 1 : 0,
          refresh: levelId % 15 === 0 ? 1 : 0
      };

      onComplete(levelId, starCount, rewards);
  };

  const useHint = () => {
    if (inventory.hint <= 0) return;
    // Logic to find a valid match and highlight it...
  };

  const useFreeze = () => {
    if (inventory.freeze <= 0) return;
    setIsFrozen(true);
    setTimeout(() => setIsFrozen(false), 8000);
  };

  const useBombItem = () => {
    if (inventory.bomb <= 0) return;
    const active = blocks.filter(b => !b.isRemoved && !b.isFiller);
    if (active.length >= 3) {
      const targets = active.sort(() => Math.random() - 0.5).slice(0, 3).map(b => b.id);
      setBlocks(prev => prev.map(b => targets.includes(b.id) ? { ...b, isRemoved: true } : b));
    }
  };

  const useRefresh = () => {
    if (inventory.refresh <= 0) return;
    const interactiveBlocks = blocks.filter(b => !b.isRemoved && !b.isFiller);
    if (interactiveBlocks.length === 0) return;

    // Refresh only the interactive blocks that are still on board
    const targetCount = Math.floor(interactiveBlocks.length / 3) * 3;
    const removedExtraCount = interactiveBlocks.length - targetCount;

    const newBlocks = [...blocks];
    // Find indices of interactive blocks
    const interactiveIndices = blocks.map((b, i) => (!b.isRemoved && !b.isFiller) ? i : -1).filter(i => i !== -1);
    const shuffledIndices = interactiveIndices.sort(() => Math.random() - 0.5);

    // Remove extra to keep multiple of 3
    for (let i = 0; i < removedExtraCount; i++) {
      const idx = shuffledIndices.pop()!;
      newBlocks[idx] = { ...newBlocks[idx], isRemoved: true };
    }

    // Repopulate with fresh triples
    for (let i = 0; i < shuffledIndices.length; i += 3) {
      const [a, b, c] = generateTriple();
      const vals = [a, b, c].sort(() => Math.random() - 0.5);
      
      newBlocks[shuffledIndices[i]] = { ...newBlocks[shuffledIndices[i]], value: vals[0], type: BlockType.STANDARD };
      newBlocks[shuffledIndices[i+1]] = { ...newBlocks[shuffledIndices[i+1]], value: vals[1], type: BlockType.STANDARD };
      newBlocks[shuffledIndices[i+2]] = { ...newBlocks[shuffledIndices[i+2]], value: vals[2], type: BlockType.STANDARD };
    }

    setBlocks(newBlocks);
    setSelectedIds([]);
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 bg-blue-600 text-white flex justify-between items-center shadow-lg">
        <button onClick={onQuit} className="font-bold bg-blue-700 px-3 py-1 rounded-lg">退出</button>
        <div className="text-center">
            <h2 className="text-xl font-black">第 {levelId} 关</h2>
            <p className="text-xs opacity-80 uppercase tracking-widest">
                {config.mode === GameMode.ADDITION ? '加法挑战' : 
                 config.mode === GameMode.SUBTRACTION ? '减法挑战' : 
                 config.mode === GameMode.MULTIPLICATION ? '乘法挑战' : '除法挑战'}
            </p>
        </div>
        <div className="text-right">
            <div className={`text-2xl font-black min-w-[4rem] ${timeLeft < 10 ? 'text-red-400 animate-pulse' : ''}`}>
                {timeLeft.toFixed(1)}s
            </div>
        </div>
      </div>

      {/* Progress & Score */}
      <div className="px-4 py-2 bg-blue-50 flex justify-between items-center text-blue-800 font-bold border-b">
        <div className="flex items-center gap-2">
            <span>分数: {score}</span>
            {combo > 1 && <span className="bg-orange-500 text-white px-2 rounded-full text-xs animate-bounce">Combo x{combo}</span>}
        </div>
        <div className="flex gap-1 text-xl">
            <span className={score > 500 ? 'text-yellow-500' : 'text-gray-300'}>★</span>
            <span className={score > 1500 ? 'text-yellow-500' : 'text-gray-300'}>★</span>
            <span className={score > 3000 ? 'text-yellow-500' : 'text-gray-300'}>★</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 p-4 flex items-center justify-center bg-sky-50 overflow-hidden">
        <div 
          className="game-grid"
          style={{ 
            gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
            width: '100%',
            maxWidth: `${Math.min(500, config.gridSize * 70)}px`
          }}
        >
          {blocks.map(block => (
            <div
              key={block.id}
              onClick={() => handleBlockClick(block)}
              className={`
                aspect-square rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-md pop-scale cursor-pointer
                ${block.isRemoved ? 'opacity-0 pointer-events-none' : ''}
                ${selectedIds.includes(block.id) ? 'bg-yellow-400 border-4 border-yellow-600 scale-105 z-10' : 
                  block.type === BlockType.ICE ? 'block-ice text-blue-300' : 
                  block.type === BlockType.LOCKED ? 'block-locked text-gray-400' : 
                  block.type === BlockType.BOMB ? 'block-bomb text-red-600' : 
                  'block-standard text-blue-900'}
                ${block.isFiller ? 'opacity-40 cursor-default' : ''}
              `}
            >
              {!block.isRemoved && !block.isFiller && block.value}
              {!block.isRemoved && block.isFiller && <span className="text-xl opacity-30">❄️</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Equation Preview */}
      <div className="h-20 bg-white border-t flex items-center justify-center gap-4 px-4 shadow-inner">
          <div className="text-3xl font-black text-blue-600">
             {selectedIds.length > 0 ? (
               <div className="flex items-center gap-2">
                 {selectedIds.map((id, idx) => {
                   const b = blocks.find(x => x.id === id);
                   return (
                     <React.Fragment key={id}>
                        <span className="bg-yellow-100 px-3 py-1 rounded-lg border-2 border-yellow-200 min-w-[3.5rem] text-center shadow-sm">{b?.value}</span>
                        {idx === 0 && <span className="text-gray-400 text-2xl">
                            {config.mode === GameMode.ADDITION ? '+' : 
                             config.mode === GameMode.SUBTRACTION ? '-' : 
                             config.mode === GameMode.MULTIPLICATION ? '×' : '÷'}
                        </span>}
                        {idx === 1 && <span className="text-gray-400 text-2xl">=</span>}
                     </React.Fragment>
                   )
                 })}
                 {selectedIds.length < 3 && <span className="text-gray-200 animate-pulse text-xl">?</span>}
               </div>
             ) : (
               <span className="text-gray-300 text-lg">依次选择三个数字组成算式</span>
             )}
          </div>
      </div>

      {/* Inventory */}
      <div className="p-4 pb-8 bg-sky-100 flex justify-around items-center border-t">
          <button onClick={useHint} className="flex flex-col items-center group">
              <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-md border-b-4 border-gray-300 group-active:translate-y-1 ${inventory.hint === 0 ? 'grayscale opacity-50' : ''}`}>💡</div>
              <span className="text-xs font-bold mt-1 text-blue-800">提示 {inventory.hint}</span>
          </button>
          <button onClick={useFreeze} className="flex flex-col items-center group">
              <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-md border-b-4 border-gray-300 group-active:translate-y-1 ${inventory.freeze === 0 ? 'grayscale opacity-50' : ''}`}>❄️</div>
              <span className="text-xs font-bold mt-1 text-blue-800">冻结 {inventory.freeze}</span>
          </button>
          <button onClick={useBombItem} className="flex flex-col items-center group">
              <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-md border-b-4 border-gray-300 group-active:translate-y-1 ${inventory.bomb === 0 ? 'grayscale opacity-50' : ''}`}>💣</div>
              <span className="text-xs font-bold mt-1 text-blue-800">炸弹 {inventory.bomb}</span>
          </button>
          <button onClick={useRefresh} className="flex flex-col items-center group">
              <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-md border-b-4 border-gray-300 group-active:translate-y-1 ${inventory.refresh === 0 ? 'grayscale opacity-50' : ''}`}>🔄</div>
              <span className="text-xs font-bold mt-1 text-blue-800">重组 {inventory.refresh}</span>
          </button>
      </div>

      {/* Game Over Overlay */}
      {isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
              <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
                  <h2 className="text-4xl font-black text-red-600 mb-4">挑战失败</h2>
                  <p className="text-gray-600 mb-8 font-bold text-lg">时间耗尽了！下次动作要快一点哦。</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg mb-4 text-xl"
                  >
                    重试
                  </button>
                  <button 
                    onClick={onQuit}
                    className="w-full bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl text-xl"
                  >
                    返回地图
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default GameView;
