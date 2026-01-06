
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Block, BlockType, GameMode, LevelConfig } from '../types';
import { getLevelConfig } from '../constants';

interface GameViewProps {
  levelId: number;
  inventory: { hint: number; freeze: number; bomb: number; refresh: number };
  onComplete: (levelId: number, stars: number, rewards: any, remainingInventory: any) => void;
  onQuit: () => void;
}

const playSound = (type: 'match' | 'win' | 'hint' | 'useItem') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (type === 'match' || type === 'useItem') {
    osc.type = type === 'match' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
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
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hintedIds, setHintedIds] = useState<string[]>([]); 
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [isFrozen, setIsFrozen] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [victoryStats, setVictoryStats] = useState<{ stars: number; rewards: Record<string, number> }>({ stars: 0, rewards: {} });
  
  // 核心：当前关卡内的实时道具库存
  const [sessionInventory, setSessionInventory] = useState(inventory);

  const generateTriple = useCallback(() => {
    let a, b, c;
    let maxVal = 10;
    if (levelId <= 20) maxVal = 10;
    else if (levelId <= 40) maxVal = 20;
    else if (levelId <= 60) maxVal = 20;
    else if (levelId <= 80) maxVal = 100;
    else maxVal = 100;

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

  useEffect(() => { initBoard(); }, [initBoard]);

  useEffect(() => {
    if (blocks.length > 0 && !isVictory && !isGameOver) {
      const isDone = blocks.every(b => b.isRemoved || b.isFiller);
      if (isDone) {
        finishLevel();
      }
    }
  }, [blocks, isVictory, isGameOver]);

  useEffect(() => {
    if (timeLeft <= 0) { setIsGameOver(true); return; }
    if (isFrozen || isGameOver || isVictory) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 0.1;
        return next <= 0 ? 0 : next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [timeLeft, isFrozen, isGameOver, isVictory]);

  const handleBlockClick = (block: Block) => {
    if (block.isRemoved || block.type === BlockType.ICE || isGameOver || isVictory || block.isFiller) return;
    
    if (hintedIds.includes(block.id)) {
      setHintedIds(prev => prev.filter(id => id !== block.id));
    }

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
    const vals = selectedBlocks.map(b => b.value);
    const [a, b, c] = vals;
    let isMatch = false;
    if (config.mode === GameMode.ADDITION) isMatch = a + b === c;
    else if (config.mode === GameMode.SUBTRACTION) isMatch = a - b === c;
    else if (config.mode === GameMode.MULTIPLICATION) isMatch = a * b === c;
    else if (config.mode === GameMode.DIVISION) isMatch = b !== 0 && a / b === c;

    if (isMatch) {
      playSound('match');
      setHintedIds(prev => prev.filter(id => !ids.includes(id)));
      
      const newBlocks = blocks.map(b => {
        if (ids.includes(b.id)) {
          if (b.type === BlockType.LOCKED && b.lockCount > 1) return { ...b, lockCount: b.lockCount - 1 };
          return { ...b, isRemoved: true };
        }
        return b;
      });
      const finalBlocks = newBlocks.map((b) => {
          if (b.type === BlockType.ICE) {
              if (Math.random() > 0.4) {
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
    } else {
      setTimeout(() => { setSelectedIds([]); setCombo(0); }, 500);
    }
  };

  const finishLevel = () => {
      if (isVictory) return;
      playSound('win');
      let starCount = 1;
      if (timeLeft > config.timeLimit * 0.6) starCount = 3;
      else if (timeLeft > config.timeLimit * 0.3) starCount = 2;
      
      // 核心调整：每关固定奖励 2 次重组机会，未使用的次数会自动累积
      const rewards = { 
        hint: levelId % 5 === 0 ? 1 : 0, 
        freeze: levelId % 10 === 0 ? 1 : 0, 
        refresh: 2, // 固定奖励 2 次
        bomb: levelId % 7 === 0 ? 1 : 0
      };
      
      setVictoryStats({ stars: starCount, rewards });
      setIsVictory(true);
  };

  const useHint = () => {
    if (sessionInventory.hint <= 0 || isGameOver || isVictory) return;
    const active = blocks.filter(b => !b.isRemoved && !b.isFiller && b.type !== BlockType.ICE);
    for (let i = 0; i < active.length; i++) {
      for (let j = 0; j < active.length; j++) {
        if (i === j) continue;
        for (let k = 0; k < active.length; k++) {
          if (k === i || k === j) continue;
          const a = active[i]; const b = active[j]; const c = active[k];
          let isMatch = false;
          if (config.mode === GameMode.ADDITION) isMatch = a.value + b.value === c.value;
          else if (config.mode === GameMode.SUBTRACTION) isMatch = a.value - b.value === c.value;
          else if (config.mode === GameMode.MULTIPLICATION) isMatch = a.value * b.value === c.value;
          else if (config.mode === GameMode.DIVISION) isMatch = b.value !== 0 && a.value / b.value === c.value;
          if (isMatch) {
            playSound('hint');
            setHintedIds([a.id, b.id, c.id]);
            setSessionInventory(prev => ({ ...prev, hint: prev.hint - 1 }));
            setTimeout(() => {
              setHintedIds(prev => prev.filter(id => id !== a.id && id !== b.id && id !== c.id));
            }, 5000);
            return;
          }
        }
      }
    }
  };

  const useFreeze = () => {
    if (sessionInventory.freeze <= 0 || isGameOver || isVictory) return;
    playSound('useItem');
    setIsFrozen(true);
    setSessionInventory(prev => ({ ...prev, freeze: prev.freeze - 1 }));
    setTimeout(() => setIsFrozen(false), 8000);
  };

  const useBombItem = () => {
    if (sessionInventory.bomb <= 0 || isGameOver || isVictory) return;
    const active = blocks.filter(b => !b.isRemoved && !b.isFiller);
    if (active.length > 0) {
      playSound('useItem');
      const targets = active.sort(() => Math.random() - 0.5).slice(0, 3).map(b => b.id);
      setBlocks(prev => prev.map(b => targets.includes(b.id) ? { ...b, isRemoved: true } : b));
      setScore(prev => prev + targets.length * 50);
      setSessionInventory(prev => ({ ...prev, bomb: prev.bomb - 1 }));
    }
  };

  const useRefresh = () => {
    if (sessionInventory.refresh <= 0 || isGameOver || isVictory) return;
    const interactiveBlocks = blocks.filter(b => !b.isRemoved && !b.isFiller);
    if (interactiveBlocks.length === 0) return;
    
    playSound('useItem');
    const targetCount = Math.floor(interactiveBlocks.length / 3) * 3;
    const removedExtraCount = interactiveBlocks.length - targetCount;
    const newBlocks = [...blocks];
    const interactiveIndices = blocks.map((b, i) => (!b.isRemoved && !b.isFiller) ? i : -1).filter(i => i !== -1);
    const shuffledIndices = interactiveIndices.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < removedExtraCount; i++) {
      const idx = shuffledIndices.pop()!;
      newBlocks[idx] = { ...newBlocks[idx], isRemoved: true };
    }
    for (let i = 0; i < shuffledIndices.length; i += 3) {
      const [a, b, c] = generateTriple();
      const vals = [a, b, c].sort(() => Math.random() - 0.5);
      newBlocks[shuffledIndices[i]] = { ...newBlocks[shuffledIndices[i]], value: vals[0], type: BlockType.STANDARD };
      newBlocks[shuffledIndices[i+1]] = { ...newBlocks[shuffledIndices[i+1]], value: vals[1], type: BlockType.STANDARD };
      newBlocks[shuffledIndices[i+2]] = { ...newBlocks[shuffledIndices[i+2]], value: vals[2], type: BlockType.STANDARD };
    }
    setBlocks(newBlocks);
    setSelectedIds([]);
    setHintedIds([]);
    setSessionInventory(prev => ({ ...prev, refresh: prev.refresh - 1 }));
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden relative">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-center shadow-xl z-10">
        <button onClick={onQuit} className="font-black bg-blue-700/50 border-2 border-white/20 px-4 py-2 rounded-xl active:scale-95 text-sm">退出</button>
        <div className="text-center">
            <h2 className="text-xl font-black italic">第 {levelId} 关</h2>
            <div className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                {config.mode === GameMode.ADDITION ? '加法挑战' : 
                 config.mode === GameMode.SUBTRACTION ? '减法挑战' : 
                 config.mode === GameMode.MULTIPLICATION ? '乘法挑战' : '除法挑战'}
            </div>
        </div>
        <div className="text-right">
            <div className={`text-2xl font-black min-w-[5rem] ${timeLeft < 10 ? 'text-red-400 animate-pulse' : ''}`}>
                {timeLeft.toFixed(1)}<span className="text-xs ml-1 opacity-60">秒</span>
            </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-blue-50 flex justify-between items-center text-blue-800 font-black border-b-2 border-blue-100">
        <div className="text-lg">得分: {score} {combo > 1 && <span className="ml-2 text-orange-500 text-xl font-black">x{combo}</span>}</div>
        <div className="flex gap-1 text-2xl">
            {[1, 2, 3].map(s => <span key={s} className={score > s * 1000 ? 'text-yellow-500' : 'text-gray-300'}>★</span>)}
        </div>
      </div>

      <div className="flex-1 p-4 flex items-center justify-center bg-[#f8fafc] overflow-hidden">
        <div className="game-grid" style={{ gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`, width: '100%', maxWidth: `${Math.min(500, config.gridSize * 70)}px` }}>
          {blocks.map(block => {
            const isSelected = selectedIds.includes(block.id);
            const isHinted = hintedIds.includes(block.id);
            return (
              <div 
                key={block.id} 
                onClick={() => handleBlockClick(block)} 
                className={`
                  aspect-square rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg pop-scale cursor-pointer 
                  ${block.isRemoved ? 'opacity-0 pointer-events-none' : ''} 
                  ${isSelected ? 'bg-yellow-400 border-4 border-yellow-700 scale-105 z-10' : 
                    isHinted ? 'bg-purple-100 border-4 border-purple-500 animate-pulse scale-105 shadow-[0_0_15px_rgba(168,85,247,0.6)]' :
                    block.type === BlockType.ICE ? 'block-ice text-blue-300' : 
                    block.type === BlockType.LOCKED ? 'block-locked text-gray-400' : 
                    block.type === BlockType.BOMB ? 'block-bomb text-red-600' : 'block-standard text-blue-900'} 
                  ${block.isFiller ? 'opacity-40 cursor-default' : ''}
                `}
              >
                {!block.isRemoved && !block.isFiller && block.value}
                {!block.isRemoved && block.isFiller && <span className="text-xl opacity-30">❄️</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-24 bg-white border-t-2 border-blue-50 flex items-center justify-center shadow-inner">
          <div className="text-3xl font-black text-blue-600">
             {selectedIds.length > 0 ? (
               <div className="flex items-center gap-2">
                 {selectedIds.map((id, idx) => {
                   const b = blocks.find(x => x.id === id);
                   return (
                     <React.Fragment key={id}>
                        <span className="bg-yellow-100 px-4 py-2 rounded-xl border-2 border-yellow-200 min-w-[3.5rem] text-center shadow-sm">{b?.value}</span>
                        {idx === 0 && <span className="text-gray-300">{config.mode === GameMode.ADDITION ? '+' : config.mode === GameMode.SUBTRACTION ? '-' : config.mode === GameMode.MULTIPLICATION ? '×' : '÷'}</span>}
                        {idx === 1 && <span className="text-gray-300">=</span>}
                     </React.Fragment>
                   )
                 })}
                 {selectedIds.length < 3 && <span className="text-gray-200 animate-pulse">?</span>}
               </div>
             ) : <span className="text-gray-300 text-lg font-bold italic tracking-widest uppercase text-center px-4">找到正确的算式吧！</span>}
          </div>
      </div>

      <div className="p-4 pb-8 bg-sky-100 flex justify-around items-center border-t-4 border-white shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <button onClick={useHint} disabled={sessionInventory.hint <= 0} className={`flex flex-col items-center group active:scale-95 transition-all ${sessionInventory.hint <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 border-yellow-300 group-active:translate-y-1">💡</div>
              <span className="text-sm font-black mt-2 text-blue-800">提示 {sessionInventory.hint}</span>
          </button>
          <button onClick={useFreeze} disabled={sessionInventory.freeze <= 0} className={`flex flex-col items-center group active:scale-95 transition-all ${sessionInventory.freeze <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 border-blue-300 group-active:translate-y-1">❄️</div>
              <span className="text-sm font-black mt-2 text-blue-800">冻结 {sessionInventory.freeze}</span>
          </button>
          <button onClick={useBombItem} disabled={sessionInventory.bomb <= 0} className={`flex flex-col items-center group active:scale-95 transition-all ${sessionInventory.bomb <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 border-red-300 group-active:translate-y-1">💣</div>
              <span className="text-sm font-black mt-2 text-blue-800">炸弹 {sessionInventory.bomb}</span>
          </button>
          <button onClick={useRefresh} disabled={sessionInventory.refresh <= 0} className={`flex flex-col items-center group active:scale-95 transition-all ${sessionInventory.refresh <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 border-orange-300 group-active:translate-y-1">🔄</div>
              <span className="text-sm font-black mt-2 text-blue-800">重组 {sessionInventory.refresh}</span>
          </button>
      </div>

      {isVictory && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-blue-900/60 backdrop-blur-md p-8">
              <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-[0_25px_50px_rgba(0,0,0,0.5)] border-8 border-yellow-400 flex flex-col items-center transform scale-in">
                  <div className="absolute -top-16 text-8xl drop-shadow-2xl">🏆</div>
                  <h2 className="text-5xl font-black text-blue-600 mt-4 mb-2 italic text-center">进京顺利!</h2>
                  <p className="text-gray-400 font-bold mb-6">下一站已经解锁...</p>
                  
                  <div className="flex gap-4 mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`text-6xl ${s <= victoryStats.stars ? 'text-yellow-400 animate-bounce' : 'text-gray-200 opacity-50'}`} style={{ animationDelay: `${s * 150}ms` }}>★</div>
                    ))}
                  </div>

                  <div className="w-full bg-blue-50 rounded-3xl p-6 mb-8 border-2 border-blue-100">
                      <div className="text-sm text-blue-800/60 font-bold mb-4 uppercase tracking-widest text-center underline">获得进京物资</div>
                      <div className="flex justify-around items-end">
                          {Object.entries(victoryStats.rewards).map(([key, val]) => (val as number) > 0 && (
                             <div key={key} className="flex flex-col items-center">
                                <span className="text-3xl">{key === 'hint' ? '💡' : key === 'freeze' ? '❄️' : key === 'refresh' ? '🔄' : '💣'}</span>
                                <span className="text-lg font-black text-blue-600">+{val as number}</span>
                             </div>
                          ))}
                      </div>
                  </div>

                  <button 
                    onClick={() => onComplete(levelId, victoryStats.stars, victoryStats.rewards, sessionInventory)}
                    className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-[0_10px_30px_rgba(59,130,246,0.5)] text-3xl border-b-8 border-blue-800 active:translate-y-2 active:border-b-4 transition-all"
                  >
                    继续前进
                  </button>
              </div>
          </div>
      )}

      {isGameOver && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-8 text-center">
              <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl scale-in border-8 border-white">
                  <div className="text-7xl mb-4">⏰</div>
                  <h2 className="text-4xl font-black text-red-600 mb-4 drop-shadow-sm">时间到了</h2>
                  <p className="text-gray-600 mb-8 text-xl font-bold">别灰心，整理装备再出发！</p>
                  <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl mb-4 text-2xl active:scale-95 transition-transform">重新挑战</button>
                  <button onClick={onQuit} className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl text-2xl active:scale-95 transition-transform">返回地图</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default GameView;
