
import React, { useRef, useEffect } from 'react';
import { UserProgress } from '../types';
import { TOTAL_LEVELS } from '../constants';

interface MapViewProps {
  progress: UserProgress;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

const MapView: React.FC<MapViewProps> = ({ progress, onSelectLevel, onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToCurrent = (behavior: ScrollBehavior = 'smooth') => {
    const currentElement = document.getElementById(`level-node-${progress.unlockedLevel}`);
    if (currentElement && scrollRef.current) {
      currentElement.scrollIntoView({ behavior, block: 'center' });
    }
  };

  useEffect(() => {
    scrollToCurrent('auto');
    const timer = setTimeout(() => scrollToCurrent('smooth'), 400);
    return () => clearTimeout(timer);
  }, [progress.unlockedLevel]);

  const spacing = 200;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    const x = 50 + Math.sin(i * 0.5) * 15 + Math.cos(i * 0.2) * 8;
    const y = (TOTAL_LEVELS - i) * spacing + 1000; 
    points.push({ x, y });
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-[#e2e8f0]">
      {/* 顶部导航 UI */}
      <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-end bg-gradient-to-b from-red-800 to-red-700/90 border-b-4 border-yellow-500 shadow-2xl backdrop-blur-sm">
        <button onClick={onBack} className="bg-yellow-500 text-red-900 p-3 rounded-2xl shadow-lg active:scale-90 transition-transform border-2 border-white/20">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex-1 text-center px-4">
            <h1 
              className="text-4xl font-black text-white tracking-widest drop-shadow-xl"
              style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
            >
              进京导航
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
                <span className="bg-red-900/50 text-yellow-300 text-[10px] px-2 py-0.5 rounded border border-yellow-500/30 font-bold uppercase">行程规划</span>
                <span className="text-white/80 text-sm font-bold tracking-tighter">米河镇 → 北京市</span>
            </div>
        </div>

        <div className="flex flex-col items-center">
            <div className="bg-white/10 px-4 py-2 rounded-2xl border-2 border-yellow-500/30 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-2xl font-black text-yellow-400">{Object.values(progress.stars).reduce((a, b) => (a as number) + (b as number), 0)}</span>
            </div>
        </div>
      </div>

      {/* 地图主容器 */}
      <div 
        ref={scrollRef}
        className="h-full w-full overflow-y-auto no-scrollbar scroll-smooth bg-[#f1f5f9]"
        style={{ perspective: '1000px' }}
      >
        <div className="relative mx-auto w-full max-w-2xl" style={{ height: `${TOTAL_LEVELS * spacing + 2000}px` }}>
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <filter id="shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2"/>
              </filter>
            </defs>
            <path
              d={`M ${points[0].x}% ${points[0].y} ` + points.slice(1).map(p => `L ${p.x}% ${p.y}`).join(' ')}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="100"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-50"
              filter="url(#shadow)"
            />
            <path
              d={`M ${points[0].x}% ${points[0].y} ` + points.slice(1).map(p => `L ${p.x}% ${p.y}`).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40"
            />
          </svg>

          {points.map((p, i) => {
            const levelId = i + 1;
            const isUnlocked = levelId <= progress.unlockedLevel;
            const stars = progress.stars[levelId] || 0;
            const isCurrent = levelId === progress.unlockedLevel;
            const dist = Math.abs(levelId - progress.unlockedLevel);
            const scale = isCurrent ? 2.0 : Math.max(0.45, 1.2 - (dist * 0.12));
            const opacity = isCurrent ? 1 : Math.max(0.3, 1.0 - (dist * 0.08));
            const blur = isCurrent ? 0 : Math.min(dist * 0.5, 3);

            return (
              <div
                key={levelId}
                id={`level-node-${levelId}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500 ease-out"
                style={{ 
                    left: `${p.x}%, top: ${p.y}px`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    opacity: opacity,
                    filter: `blur(${blur}px)`,
                    zIndex: isCurrent ? 50 : 20 - Math.min(dist, 15)
                }}
              >
                {isCurrent && (
                  <div className="absolute -top-24 z-50 animate-bounce">
                    <div className="relative">
                        <span className="text-8xl drop-shadow-2xl">🚗</span>
                        <div className="absolute -bottom-2 -left-4 flex gap-1">
                            <div className="w-3 h-3 bg-blue-200 rounded-full animate-ping opacity-60"></div>
                            <div className="w-2 h-2 bg-blue-100 rounded-full animate-ping opacity-40 delay-75"></div>
                        </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onSelectLevel(levelId)}
                  disabled={!isUnlocked}
                  className={`
                    w-24 h-24 rounded-[3rem] flex items-center justify-center font-black shadow-2xl border-b-[12px] transition-all relative
                    ${isCurrent ? 'bg-blue-600 border-blue-900 text-white ring-[20px] ring-blue-100/60' : 
                      isUnlocked ? 'bg-white border-blue-100 text-blue-700' : 
                      'bg-gray-200 border-gray-400 text-gray-400 cursor-not-allowed'}
                  `}
                  style={{ fontSize: isCurrent ? '3.5rem' : '2.2rem' }}
                >
                  {levelId}
                </button>

                {isUnlocked && !isCurrent && (
                  <div className="mt-6 flex bg-white/80 px-2 py-0.5 rounded-full border border-blue-50">
                    {[1, 2, 3].map(s => (
                      <span key={s} className={`text-xl ${s <= stars ? 'text-yellow-500' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                )}
                
                <div className={`mt-2 font-black tracking-widest uppercase ${isCurrent ? 'text-blue-800 text-xl' : 'text-gray-400 text-xs'}`}>
                    {levelId === 1 ? '米河枢纽' : levelId === 100 ? '北京终点' : `驿站 ${levelId}`}
                </div>
              </div>
            );
          })}

          {/* 北京终点地标 - 天安门图标 */}
          <div className="absolute w-full top-[100px] flex justify-center pointer-events-none">
             <div className="bg-red-800 text-yellow-400 p-16 rounded-[5rem] font-black shadow-[0_50px_100px_rgba(0,0,0,0.4)] border-8 border-yellow-500 flex flex-col items-center">
                <svg viewBox="0 0 100 100" className="w-56 h-56 mb-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    <rect x="5" y="65" width="90" height="25" fill="#B91C1C" rx="2" />
                    <path d="M42 90 L42 78 Q50 68 58 78 L58 90 Z" fill="#7F1D1D" />
                    <path d="M10 65 L90 65 L85 55 L15 55 Z" fill="#FACC15" />
                    <rect x="25" y="38" width="50" height="17" fill="#B91C1C" rx="1" />
                    <path d="M18 40 L82 40 L78 22 L22 22 Z" fill="#FACC15" />
                    <path d="M50 8 L55 22 L45 22 Z" fill="#FACC15" />
                </svg>
                <h3 className="text-8xl mb-2 tracking-[2rem]">北京</h3>
                <p className="text-2xl opacity-80 mt-6 bg-red-900 px-8 py-2 rounded-full border border-yellow-500/50">
                   天安门 · 终点站
                </p>
             </div>
          </div>

          {/* 米河起点地标 */}
          <div className="absolute w-full bottom-[100px] flex justify-center pointer-events-none">
             <div className="bg-slate-700 text-white p-12 rounded-[4rem] font-black text-4xl shadow-2xl border-8 border-slate-500 flex flex-col items-center opacity-60">
                <div className="text-[8rem] mb-4">🏘️</div>
                <h3 className="text-5xl mb-2">米河镇</h3>
                <p className="text-lg opacity-60 mt-4 tracking-[0.5rem] uppercase font-normal">出发起点</p>
             </div>
          </div>
        </div>
      </div>

      {/* 底部浮动控制 */}
      <div className="absolute bottom-6 left-0 w-full px-6 flex justify-between items-center pointer-events-none">
          {/* 左侧：剩余驿站 */}
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-[2rem] border-4 border-blue-500 shadow-2xl pointer-events-auto">
             <div className="text-blue-900 font-black text-[10px] opacity-70">目的地剩余</div>
             <div className="text-xl font-black text-blue-600 tracking-tighter leading-tight">
                {TOTAL_LEVELS - progress.unlockedLevel} 
                <span className="text-[10px] text-gray-400 ml-1">个驿站</span>
             </div>
          </div>

          {/* 中间：点击进入当前挑战按钮 */}
          <button 
            onClick={() => onSelectLevel(progress.unlockedLevel)}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-blue-600 text-white px-8 py-3 rounded-full font-black shadow-[0_10px_20px_rgba(59,130,246,0.4)] pointer-events-auto border-4 border-white animate-pulse mb-2 active:scale-90 transition-transform flex flex-col items-center"
          >
            <span className="text-[10px] opacity-80 leading-none">正在挑战</span>
            <span className="text-xl leading-tight">第 {progress.unlockedLevel} 关</span>
          </button>

          {/* 右侧：定位按钮 */}
          <button 
            onClick={() => scrollToCurrent('smooth')}
            className="bg-blue-600 text-white w-20 h-20 rounded-3xl shadow-[0_15px_40px_rgba(59,130,246,0.5)] flex flex-col items-center justify-center border-b-8 border-blue-800 active:translate-y-2 active:border-b-0 transition-all pointer-events-auto"
          >
            <span className="text-3xl">🎯</span>
            <span className="text-[9px] font-black mt-1">定位小车</span>
          </button>
      </div>
    </div>
  );
};

export default MapView;
