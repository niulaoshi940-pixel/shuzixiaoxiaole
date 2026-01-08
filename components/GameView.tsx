
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Block, BlockType, GameMode, LevelConfig } from '../types';
import { getLevelConfig, LEVEL_NAMES } from '../constants';

interface GameViewProps {
  levelId: number;
  inventory: { hint: number; freeze: number; bomb: number; refresh: number };
  onComplete: (levelId: number, stars: number, rewards: any, remainingInventory: any) => void;
  onQuit: () => void;
}

const playSound = (type: 'match' | 'win' | 'hint' | 'useItem' | 'bomb') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (type === 'match' || type === 'useItem' || type === 'bomb') {
    osc.type = type === 'bomb' ? 'square' : (type === 'match' ? 'triangle' : 'sine');
    osc.frequency.setValueAtTime(type === 'bomb' ? 150 : 523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(type === 'bomb' ? 40 : 1046.5, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'hint') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880.00, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'win') {
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.1);
      o.stop(ctx.currentTime + 1.5);
    });
  }
};

const GameView: React.FC<GameViewProps> = ({ levelId, inventory, onComplete, onQuit }) => {
  const config = useMemo(() => getLevelConfig(levelId), [levelId]);
  const locationName = useMemo(() => LEVEL_NAMES[levelId - 1] || `第${levelId}站`, [levelId]);
  
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hintedIds, setHintedIds] = useState<string[]>([]); 
  const [explodingIds, setExplodingIds] = useState<string[]>([]);
  const [isGridShaking, setIsGridShaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [showHelp, setShowHelp] = useState(false);
  
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeTimeRemaining, setFreezeTimeRemaining] = useState(0);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [victoryStats, setVictoryStats] = useState<{ stars: number; rewards: Record<string, number> }>({ stars: 0, rewards: {} });
  
  const [localHintCount, setLocalHintCount] = useState(3);
  const [localRefreshCount, setLocalRefreshCount] = useState(3);
  const [accumulatedBombCount, setAccumulatedBombCount] = useState(inventory.bomb);
  const [accumulatedFreezeCount, setAccumulatedFreezeCount] = useState(inventory.freeze);

  const generateTriple = useCallback(() => {
    let a, b, c;
    const maxVal = config.maxVal;

    if (config.mode === GameMode.ADDITION) {
      c = Math.floor(Math.random() * (maxVal + 1)); 
      a = Math.floor(Math.random() * (c + 1));
      b = c - a;
    } else if (config.mode === GameMode.SUBTRACTION) {
      a = Math.floor(Math.random() * (maxVal + 1));
      b = Math.floor(Math.random() * (a + 1));
      c = a - b;
    } else if (config.mode === GameMode.TARGET_SUM) {
      const target = config.maxVal;
      a = Math.floor(Math.random() * (target + 1));
      b = Math.floor(Math.random() * (target - a + 1));
      c = target - a - b;
    } else if (config.mode === GameMode.MULTIPLICATION) {
      const multMax = Math.max(5, Math.floor(Math.sqrt(maxVal)));
      a = Math.floor(Math.random() * (multMax + 1));
      b = Math.floor(Math.random() * (multMax + 1));
      c = a * b;
    } else {
      c = Math.floor(Math.random() * 10);
      b = Math.floor(Math.random() * 9) + 1;
      a = c * b;
    }
    return [a, b, c];
  }, [config.mode, config.maxVal]);

  const initBoard = useCallback(() => {
    const totalGridSlots = config.gridSize * config.gridSize;
    const playableCount = Math.floor(totalGridSlots / 3) * 3;
    const fillerCount = totalGridSlots - playableCount;
    const newBlocks: Block[] = [];
    const triplesCount = Math.floor(playableCount / 3);
    const distractorTriples = Math.floor(triplesCount * config.distractorRate);
    const validTriples = triplesCount - distractorTriples;

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
          lockCount: type === BlockType.LOCKED ? 2 : 0
        });
      });
    }

    const maxDistVal = config.maxVal;
    for (let i = 0; i < distractorTriples; i++) {
      for (let j = 0; j < 3; j++) {
        newBlocks.push({
          id: Math.random().toString(36).substr(2, 9),
          value: Math.floor(Math.random() * (maxDistVal + 1)),
          type: BlockType.STANDARD,
          isRemoved: false,
          isSelected: false,
          lockCount: 0
        });
      }
    }

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

    // 每一个新的关卡要保证至少有一个炸弹方块在棋盘上
    const hasAnyBomb = newBlocks.some(b => b.type === BlockType.BOMB);
    if (!hasAnyBomb && newBlocks.length > 0) {
      const targetBlock = newBlocks.find(b => !b.isFiller && b.type === BlockType.STANDARD) || 
                          newBlocks.find(b => !b.isFiller && b.type !== BlockType.ICE);
      if (targetBlock) {
        targetBlock.type = BlockType.BOMB;
      }
    }

    setBlocks(newBlocks.sort(() => Math.random() - 0.5));
  }, [config, generateTriple]);

  useEffect(() => { initBoard(); }, [initBoard]);

  useEffect(() => {
    if (blocks.length > 0 && !isVictory && !isGameOver) {
      const isDone = blocks.every(b => b.isRemoved || b.isFiller);
      if (isDone) finishLevel();
    }
  }, [blocks, isVictory, isGameOver]);

  useEffect(() => {
    if (timeLeft <= 0) { setIsGameOver(true); return; }
    if (isFrozen || isGameOver || isVictory) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 0.1));
    }, 100);
    return () => clearInterval(timer);
  }, [timeLeft, isFrozen, isGameOver, isVictory]);

  useEffect(() => {
    if (!isFrozen) return;
    const timer = setInterval(() => {
      setFreezeTimeRemaining(prev => {
        if (prev <= 0.1) {
          setIsFrozen(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isFrozen]);

  const handleBlockClick = (block: Block) => {
    if (block.isRemoved || block.type === BlockType.ICE || isGameOver || isVictory || block.isFiller) return;
    if (hintedIds.includes(block.id)) setHintedIds(prev => prev.filter(id => id !== block.id));
    if (selectedIds.includes(block.id)) {
      setSelectedIds(prev => prev.filter(id => id !== block.id));
      return;
    }
    if (selectedIds.length < 3) {
      const nextSelected = [...selectedIds, block.id];
      setSelectedIds(nextSelected);
      if (nextSelected.length === 3) checkMatch(nextSelected);
    }
  };

  const checkMatch = (ids: string[]) => {
    const selectedBlocks = ids.map(id => blocks.find(b => b.id === id)!);
    const [a, b, c] = selectedBlocks.map(b => b.value);
    let isMatch = false;
    if (config.mode === GameMode.ADDITION) isMatch = a + b === c;
    else if (config.mode === GameMode.SUBTRACTION) isMatch = a - b === c;
    else if (config.mode === GameMode.MULTIPLICATION) isMatch = a * b === c;
    else if (config.mode === GameMode.TARGET_SUM) isMatch = a + b + c === config.maxVal;

    if (isMatch) {
      playSound('match');
      setHintedIds(prev => prev.filter(id => !ids.includes(id)));
      
      const hasBomb = selectedBlocks.some(b => b.type === BlockType.BOMB);
      
      const gridIndices = ids.map(id => blocks.findIndex(b => b.id === id));
      const adjacentIndices = new Set<number>();
      gridIndices.forEach(idx => {
        const row = Math.floor(idx / config.gridSize);
        const col = idx % config.gridSize;
        if (row > 0) adjacentIndices.add(idx - config.gridSize);
        if (row < config.gridSize - 1) adjacentIndices.add(idx + config.gridSize);
        if (col > 0) adjacentIndices.add(idx - 1);
        if (col < config.gridSize - 1) adjacentIndices.add(idx + 1);
      });

      const newBlocks = blocks.map((b, idx) => {
        if (ids.includes(b.id)) {
          if (b.type === BlockType.LOCKED && b.lockCount > 1) return { ...b, lockCount: b.lockCount - 1 };
          return { ...b, isRemoved: true };
        }
        if (adjacentIndices.has(idx) && b.type === BlockType.ICE && !b.isRemoved) {
          return { ...b, isRemoved: true };
        }
        return b;
      });

      if (hasBomb) {
        playSound('bomb');
        setIsGridShaking(true);
        setTimeout(() => setIsGridShaking(false), 400);
        
        const remainingActive = newBlocks.filter(b => !b.isRemoved && !b.isFiller);
        if (remainingActive.length > 0) {
            const extraTargets = remainingActive.sort(() => Math.random() - 0.5).slice(0, 2).map(t => t.id);
            extraTargets.forEach(tid => {
                const targetIdx = newBlocks.findIndex(nb => nb.id === tid);
                if (targetIdx !== -1) newBlocks[targetIdx] = { ...newBlocks[targetIdx], isRemoved: true };
            });
        }
      }

      setBlocks(newBlocks);
      setSelectedIds([]);
      setScore(prev => prev + 100 + (combo * 20));
      setCombo(prev => prev + 1);
    } else {
      setTimeout(() => { setSelectedIds([]); setCombo(0); }, 500);
    }
  };

  const finishLevel = () => {
      if (isVictory) return;
      playSound('win');
      let starCount = timeLeft > config.timeLimit * 0.6 ? 3 : (timeLeft > config.timeLimit * 0.3 ? 2 : 1);
      const rewards = { 
        hint: 0, 
        freeze: levelId % 10 === 0 ? 1 : 0, 
        refresh: 0, 
        bomb: levelId % 7 === 0 ? 1 : 0
      };
      setVictoryStats({ stars: starCount, rewards });
      setIsVictory(true);
  };

  const useHint = () => {
    if (localHintCount <= 0 || isGameOver || isVictory) return;
    const active = blocks.filter(b => !b.isRemoved && !b.isFiller && b.type !== BlockType.ICE);
    for (let i = 0; i < active.length; i++) {
      for (let j = 0; j < active.length; j++) {
        if (i === j) continue;
        for (let k = 0; k < active.length; k++) {
          if (k === i || k === j) continue;
          const [a, b, c] = [active[i], active[j], active[k]];
          let isMatch = false;
          if (config.mode === GameMode.ADDITION) isMatch = a.value + b.value === c.value;
          else if (config.mode === GameMode.SUBTRACTION) isMatch = a.value - b.value === c.value;
          else if (config.mode === GameMode.MULTIPLICATION) isMatch = a.value * b.value === c.value;
          else if (config.mode === GameMode.TARGET_SUM) isMatch = a.value + b.value + c.value === config.maxVal;
          
          if (isMatch) {
            playSound('hint');
            setHintedIds([a.id, b.id, c.id]);
            setLocalHintCount(prev => prev - 1);
            setTimeout(() => setHintedIds([]), 5000);
            return;
          }
        }
      }
    }
  };

  const useFreeze = () => {
    if (accumulatedFreezeCount <= 0 || isGameOver || isVictory) return;
    playSound('useItem');
    setIsFrozen(true);
    setFreezeTimeRemaining(8);
    setAccumulatedFreezeCount(prev => prev - 1);
  };

  const useBombItem = () => {
    if (accumulatedBombCount <= 0 || isGameOver || isVictory) return;
    const active = blocks.filter(b => !b.isRemoved && !b.isFiller);
    if (active.length > 0) {
      playSound('bomb');
      const targets = active.sort(() => Math.random() - 0.5).slice(0, 3).map(b => b.id);
      setExplodingIds(targets);
      setIsGridShaking(true);
      setTimeout(() => {
        setBlocks(prev => prev.map(b => targets.includes(b.id) ? { ...b, isRemoved: true } : b));
        setScore(prev => prev + targets.length * 50);
        setExplodingIds([]);
        setIsGridShaking(false);
      }, 500);
      setAccumulatedBombCount(prev => prev - 1);
    }
  };

  const useRefresh = () => {
    if (localRefreshCount <= 0 || isGameOver || isVictory) return;
    playSound('useItem');
    setBlocks(prev => {
      const activeIndices: number[] = [];
      prev.forEach((b, i) => { if (!b.isRemoved && !b.isFiller) activeIndices.push(i); });
      
      if (activeIndices.length === 0) return prev;

      const newBlocks = [...prev];
      const currentCount = activeIndices.length;
      const newCount = Math.floor(currentCount / 3) * 3;
      
      const triplesCount = newCount / 3;
      const distractorTriples = Math.floor(triplesCount * config.distractorRate);
      const validTriples = triplesCount - distractorTriples;
      const newPool: { val: number, type: BlockType, lock: number }[] = [];
      
      for (let i = 0; i < validTriples; i++) {
        const [a, b, c] = generateTriple();
        [a, b, c].forEach(v => {
          const typeRoll = Math.random();
          let type = BlockType.STANDARD;
          if (typeRoll < (config.specialRates[BlockType.ICE] || 0)) type = BlockType.ICE;
          else if (typeRoll < (config.specialRates[BlockType.LOCKED] || 0) + (config.specialRates[BlockType.ICE] || 0)) type = BlockType.LOCKED;
          else if (typeRoll < (config.specialRates[BlockType.BOMB] || 0) + (config.specialRates[BlockType.LOCKED] || 0) + (config.specialRates[BlockType.ICE] || 0)) type = BlockType.BOMB;
          newPool.push({ val: v, type, lock: type === BlockType.LOCKED ? 2 : 0 });
        });
      }
      
      const maxDistVal = config.maxVal;
      while (newPool.length < newCount) {
        newPool.push({ val: Math.floor(Math.random() * (maxDistVal + 1)), type: BlockType.STANDARD, lock: 0 });
      }
      
      newPool.sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < newCount; i++) {
        const idx = activeIndices[i];
        newBlocks[idx] = { 
          ...newBlocks[idx], 
          value: newPool[i].val, 
          type: newPool[i].type, 
          lockCount: newPool[i].lock, 
          isSelected: false 
        };
      }
      
      for (let i = newCount; i < currentCount; i++) {
        const idx = activeIndices[i];
        newBlocks[idx] = { ...newBlocks[idx], isRemoved: true, isSelected: false };
      }

      return newBlocks;
    });
    setSelectedIds([]);
    setHintedIds([]);
    setLocalRefreshCount(prev => prev - 1);
  };

  const equationDisplay = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const selectedValues = selectedIds.map(id => blocks.find(b => b.id === id)?.value);
    
    if (config.mode === GameMode.TARGET_SUM) {
      const target = config.maxVal;
      if (selectedIds.length === 1) return <div className="flex items-center text-xl font-black bg-white/80 px-4 py-1 rounded-full border-2 border-blue-200 shadow-inner">{selectedValues[0]} + ? + ? = {target}</div>;
      if (selectedIds.length === 2) return <div className="flex items-center text-xl font-black bg-white/80 px-4 py-1 rounded-full border-2 border-blue-200 shadow-inner">{selectedValues[0]} + {selectedValues[1]} + ? = {target}</div>;
      if (selectedIds.length === 3) {
        const sum = (selectedValues[0] || 0) + (selectedValues[1] || 0) + (selectedValues[2] || 0);
        return <div className={`flex items-center text-xl font-black bg-white/80 px-4 py-1 rounded-full border-2 ${sum === target ? 'border-green-400' : 'border-red-400'} shadow-inner`}>{selectedValues[0]} + {selectedValues[1]} + {selectedValues[2]} = {target}</div>;
      }
      return null;
    }

    let operator = '+';
    if (config.mode === GameMode.SUBTRACTION) operator = '-';
    else if (config.mode === GameMode.MULTIPLICATION) operator = '×';
    const opSpan = <span className="text-red-500 font-black px-1">{operator}</span>;
    if (selectedIds.length === 1) return <div className="flex items-center text-2xl font-black bg-white/80 px-4 py-1 rounded-full border-2 border-blue-200 shadow-inner">{selectedValues[0]}{opSpan}</div>;
    if (selectedIds.length === 2) return <div className="flex items-center text-2xl font-black bg-white/80 px-4 py-1 rounded-full border-2 border-blue-200 shadow-inner">{selectedValues[0]}{opSpan}{selectedValues[1]}<span className="ml-1">=</span></div>;
    if (selectedIds.length === 3) return <div className="flex items-center text-2xl font-black bg-white/80 px-4 py-1 rounded-full border-2 border-blue-200 shadow-inner scale-110 transition-transform">{selectedValues[0]}{opSpan}{selectedValues[1]}<span className="mx-1">=</span>{selectedValues[2]}</div>;
    return null;
  }, [selectedIds, blocks, config.mode, config.maxVal]);

  const modeLabel = useMemo(() => {
    switch(config.mode) {
      case GameMode.ADDITION: return `${config.maxVal}以内加法`;
      case GameMode.SUBTRACTION: return `${config.maxVal}以内减法`;
      case GameMode.MULTIPLICATION: return '乘法挑战';
      case GameMode.TARGET_SUM: return `三个数加法(目标${config.maxVal})`;
      default: return '挑战进行中';
    }
  }, [config.mode, config.maxVal]);

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden relative">
      {showHelp && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-blue-900/60 backdrop-blur-md p-6">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border-4 border-blue-400 relative">
                <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-3xl text-gray-400">×</button>
                <h3 className="text-2xl font-black text-blue-600 mb-6 text-center italic">闯关指南</h3>
                <div className="space-y-4">
                    <p className="font-bold text-blue-800">当前模式: <span className="text-red-600">{modeLabel}</span></p>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0">❄️</div>
                        <div>
                            <div className="font-black text-blue-800">冰块 (障碍物)</div>
                            <p className="text-xs text-blue-600/80 mt-1 font-bold">不可点击。在它旁边完成任意算式即可震碎它！</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0">🔒</div>
                        <div>
                            <div className="font-black text-blue-800">锁定 (双重挑战)</div>
                            <p className="text-xs text-blue-600/80 mt-1 font-bold">需要参与两次正确算式。第一消开锁，第二消移除。</p>
                        </div>
                    </div>
                </div>
                <button onClick={() => setShowHelp(false)} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl mt-8 shadow-lg active:scale-95">我明白了</button>
            </div>
        </div>
      )}

      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-center shadow-xl z-10">
        <button onClick={onQuit} className="font-black bg-blue-700/50 border-2 border-white/20 px-4 py-2 rounded-xl active:scale-95 text-sm">退出</button>
        <div className="text-center">
            <h2 className="text-xl font-black italic">{locationName}</h2>
            <div className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                第 {levelId} 关 · {modeLabel}
            </div>
        </div>
        <button onClick={() => setShowHelp(true)} className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl border-2 border-white/30 active:scale-90">?</button>
      </div>

      <div className="px-6 py-3 bg-blue-50 flex justify-between items-center text-blue-800 font-black border-b-2 border-blue-100 h-16">
        <div className="flex items-center gap-4">
          <div className="text-lg">得分: {score}</div>
          {equationDisplay}
        </div>
        <div className="flex items-center gap-3">
            {/* 冻结状态提示：现在集成到顶部的计分栏中，不遮挡棋盘 */}
            {isFrozen && (
              <div className="flex items-center gap-1.5 bg-blue-200/50 px-3 py-1 rounded-full border border-blue-400 animate-pulse transition-all">
                  <span className="text-xl">❄️</span>
                  <span className="text-xl font-black text-blue-600 tabular-nums">{freezeTimeRemaining.toFixed(1)}s</span>
              </div>
            )}
            <div className="text-2xl font-black min-w-[3rem] text-right tabular-nums">
                {timeLeft.toFixed(1)}<span className="text-[10px] ml-0.5 opacity-50">s</span>
            </div>
            <div className="flex gap-1 text-2xl">
                {[1, 2, 3].map(s => <span key={s} className={score > s * 1000 ? 'text-yellow-500' : 'text-gray-300'}>★</span>)}
            </div>
        </div>
      </div>

      <div className="flex-1 p-4 flex items-center justify-center bg-[#f8fafc] overflow-hidden">
        <div className={`game-grid ${isGridShaking ? 'animate-shake' : ''}`} style={{ gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`, width: '100%', maxWidth: `${Math.min(500, config.gridSize * 70)}px` }}>
          {blocks.map(block => {
            const isSelected = selectedIds.includes(block.id);
            const isHinted = hintedIds.includes(block.id);
            const isExploding = explodingIds.includes(block.id);
            return (
              <div key={block.id} onClick={() => handleBlockClick(block)} className={`aspect-square rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg pop-scale cursor-pointer relative ${block.isRemoved ? 'opacity-0 pointer-events-none' : ''} ${isSelected ? 'bg-yellow-400 border-4 border-yellow-700 scale-105 z-10' : isHinted ? 'bg-purple-100 border-4 border-purple-500 animate-pulse scale-105 shadow-[0_0_15px_rgba(168,85,247,0.6)]' : block.type === BlockType.ICE ? 'block-ice text-blue-300' : block.type === BlockType.LOCKED ? 'block-locked text-gray-400' : block.type === BlockType.BOMB ? 'block-bomb text-red-600' : 'block-standard text-blue-900'} ${block.isFiller ? 'opacity-40 cursor-default' : ''}`}>
                {!block.isRemoved && !block.isFiller && block.value}
                {isExploding && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]"><span className="text-4xl animate-explosion">💥</span></div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 pb-8 bg-sky-100 flex justify-around items-center border-t-4 border-white shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <button onClick={useHint} disabled={localHintCount <= 0} className={`flex flex-col items-center group active:scale-95 transition-all relative ${localHintCount <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 border-yellow-300 group-active:translate-y-1">💡</div>
              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{localHintCount}</div>
              <span className="text-xs font-black mt-2 text-blue-800 tracking-tighter">提示</span>
          </button>

          <button onClick={useFreeze} disabled={accumulatedFreezeCount <= 0} className={`flex flex-col items-center group active:scale-95 transition-all relative ${accumulatedFreezeCount <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 border-blue-300 group-active:translate-y-1">❄️</div>
              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{accumulatedFreezeCount}</div>
              <span className="text-xs font-black mt-2 text-blue-800 tracking-tighter">冻结</span>
          </button>

          <button onClick={useBombItem} disabled={accumulatedBombCount <= 0} className={`flex flex-col items-center group active:scale-95 transition-all relative ${accumulatedBombCount <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 border-red-300 group-active:translate-y-1">💣</div>
              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{accumulatedBombCount}</div>
              <span className="text-xs font-black mt-2 text-blue-800 tracking-tighter">炸弹</span>
          </button>

          <button onClick={useRefresh} disabled={localRefreshCount <= 0} className={`flex flex-col items-center group active:scale-95 transition-all relative ${localRefreshCount <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 border-orange-300 group-active:translate-y-1">🔄</div>
              <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{localRefreshCount}</div>
              <span className="text-xs font-black mt-2 text-blue-800 tracking-tighter">重组</span>
          </button>
      </div>

      {isVictory && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-blue-900/60 backdrop-blur-md p-8">
              <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-[0_25px_50px_rgba(0,0,0,0.5)] border-8 border-yellow-400 flex flex-col items-center transform scale-in">
                  <div className="absolute -top-16 text-8xl drop-shadow-2xl">🏆</div>
                  <h2 className="text-3xl font-black text-blue-600 mt-4 mb-2 italic text-center">抵达{locationName}!</h2>
                  <div className="flex gap-4 mb-8">
                    {[1, 2, 3].map(s => (<div key={s} className={`text-6xl ${s <= victoryStats.stars ? 'text-yellow-400 animate-bounce' : 'text-gray-200 opacity-50'}`} style={{ animationDelay: `${s * 150}ms` }}>★</div>))}
                  </div>
                  <button onClick={() => onComplete(levelId, victoryStats.stars, victoryStats.rewards, { hint: 3, refresh: 3, bomb: accumulatedBombCount, freeze: accumulatedFreezeCount })} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-[0_10px_30px_rgba(59,130,246,0.5)] text-3xl border-b-8 border-blue-800 active:translate-y-2 active:border-b-4 transition-all">继续前进</button>
              </div>
          </div>
      )}

      {isGameOver && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-8 text-center">
              <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl scale-in border-8 border-white">
                  <div className="text-7xl mb-4">⏰</div>
                  <h2 className="text-4xl font-black text-red-600 mb-4 drop-shadow-sm">受阻于{locationName}</h2>
                  <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl mb-4 text-2xl active:scale-95 transition-transform">重新挑战</button>
                  <button onClick={onQuit} className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl text-2xl active:scale-95 transition-transform">返回地图</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default GameView;
