
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { UserProgress } from '../types';
import { TOTAL_LEVELS, LEVEL_NAMES, REGIONS, CHEST_LEVELS } from '../constants';

const SunnyStudentAvatar: React.FC = () => {
  return (
    <div className="relative w-24 h-24 animate-walk flex items-center justify-center drop-shadow-[0_12px_24px_rgba(239,68,68,0.4)]">
      <div className="absolute -bottom-2 w-14 h-4 bg-black/10 rounded-full blur-[4px]"></div>
      <div className="relative w-full h-full rounded-full border-[4px] border-white overflow-hidden bg-gradient-to-tr from-blue-400 to-blue-200 flex items-center justify-center shadow-lg">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="z-10 translate-y-3">
          <circle cx="40" cy="40" r="28" fill="#FFDBAC"/>
          <path d="M12 40C12 25 22 10 40 10C58 10 68 25 68 40" fill="#5C4033" />
          <circle cx="30" cy="42" r="4" fill="#333"/>
          <circle cx="50" cy="42" r="4" fill="#333"/>
          <path d="M33 53C33 53 36 57 40 57C44 57 47 53 47 53" stroke="#8B4513" strokeWidth="2" strokeLinecap="round"/>
          <path d="M28 66L40 74L52 66L44 80L36 80L28 66Z" fill="#EF4444" />
        </svg>
      </div>
    </div>
  );
};

interface MapViewProps {
  progress: UserProgress;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
  onClaimChest?: (levelId: number) => void; 
}

const MapView: React.FC<MapViewProps> = ({ progress, onSelectLevel, onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showChestModal, setShowChestModal] = useState<number | null>(null);
  
  const spacing = 180; 
  const topOffset = 600;

  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const x = 50 + Math.sin(i * 0.5) * 22;
      const y = (TOTAL_LEVELS - 1 - i) * spacing + topOffset; 
      pts.push({ x, y });
    }
    return pts;
  }, []);

  const totalHeight = (TOTAL_LEVELS - 1) * spacing + topOffset + 800;

  const getRegionForY = (y: number) => {
    const levelIdx = Math.floor((totalHeight - y - 800) / spacing);
    const levelId = TOTAL_LEVELS - levelIdx;
    return REGIONS.find(r => levelId >= r.start && levelId <= r.end) || REGIONS[0];
  };

  useEffect(() => {
    const targetPoint = points[progress.unlockedLevel - 1];
    if (targetPoint && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: targetPoint.y - scrollRef.current.clientHeight / 2,
        behavior: 'auto'
      });
    }
  }, []);

  return (
    <div className="h-full w-full relative overflow-hidden bg-slate-100">
      {/* 顶部状态栏 */}
      <div className="absolute top-0 left-0 w-full z-50 p-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b-2 border-slate-200 shadow-sm">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-all">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
            <h1 className="text-xl font-black text-slate-800">进京英雄路</h1>
        </div>
        <div className="bg-yellow-400 px-4 py-1.5 rounded-full border-2 border-white shadow-sm flex items-center gap-2">
            <span className="text-sm font-black text-yellow-900">{Object.values(progress.stars).reduce((a, b) => a + b, 0)}</span>
            <span className="text-xs">⭐</span>
        </div>
      </div>

      <div ref={scrollRef} className="h-full w-full overflow-y-auto no-scrollbar scroll-smooth">
        <div className="relative mx-auto w-full max-w-lg" style={{ height: `${totalHeight}px` }}>
          
          {/* 区域背景装饰 */}
          {REGIONS.map(region => (
            <div 
                key={region.name}
                className={`absolute w-full flex items-center justify-center bg-gradient-to-b ${region.color} border-t-4 border-dashed border-white/30`}
                style={{ 
                    top: `${points[TOTAL_LEVELS - region.end]?.y - spacing/2 || 0}px`,
                    height: `${(region.end - region.start + 1) * spacing}px`
                }}
            >
                <div className="opacity-10 text-9xl font-black select-none pointer-events-none transform -rotate-12">
                    {region.name}
                </div>
            </div>
          ))}

          {/* 地图路径绘制 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 100 ${totalHeight}`} preserveAspectRatio="none">
             <path 
                d={`M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} 
                fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 12" 
             />
             <path 
                d={`M ${points[0].x} ${points[0].y} ` + points.slice(1, progress.unlockedLevel).map(p => `L ${p.x} ${p.y}`).join(' ')} 
                fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
             />
          </svg>

          {/* 关卡节点 */}
          {points.map((p, i) => {
            const levelId = i + 1;
            const isUnlocked = levelId <= progress.unlockedLevel;
            const isCurrent = levelId === progress.unlockedLevel;
            const isChest = CHEST_LEVELS.includes(levelId);
            const stars = progress.stars[levelId] || 0;

            return (
              <div key={levelId} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${p.x}%`, top: `${p.y}px` }}>
                
                {isCurrent && (
                  <div className="absolute -top-24 z-50">
                    <SunnyStudentAvatar />
                  </div>
                )}

                <button
                  onClick={() => onSelectLevel(levelId)}
                  disabled={!isUnlocked}
                  className={`
                    group relative w-14 h-14 rounded-full flex items-center justify-center font-black shadow-lg transition-all
                    ${isCurrent ? 'bg-blue-600 text-white ring-8 ring-blue-500/20 scale-125 z-40' : 
                      isUnlocked ? 'bg-white text-blue-600 border-2 border-blue-100 hover:scale-110' : 
                      'bg-slate-200 text-slate-400 scale-90 opacity-60'}
                  `}
                >
                  {isChest && !isCurrent ? (
                    <span className="text-2xl animate-bounce">🎁</span>
                  ) : levelId}
                  
                  {/* 星星显示 */}
                  {isUnlocked && !isCurrent && stars > 0 && (
                    <div className="absolute -bottom-6 flex gap-0.5">
                       {[1, 2, 3].map(s => <span key={s} className={`text-[10px] ${s <= stars ? 'text-yellow-500' : 'text-slate-300'}`}>★</span>)}
                    </div>
                  )}
                </button>

                <div className={`mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${isCurrent ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>
                  {LEVEL_NAMES[i]}
                </div>
              </div>
            );
          })}

          {/* 终点与起点大图标 */}
          <div className="absolute w-full flex justify-center" style={{ top: `${points[TOTAL_LEVELS-1].y - 250}px` }}>
             <div className="text-center scale-150">
                <div className="text-6xl mb-2">🏮</div>
                <div className="bg-red-600 text-white px-6 py-1 rounded-full font-black shadow-xl">天安门</div>
             </div>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div className="absolute bottom-8 left-0 w-full px-6 flex justify-center pointer-events-none">
        <button 
          onClick={() => onSelectLevel(progress.unlockedLevel)}
          className="pointer-events-auto bg-blue-600 text-white px-10 py-4 rounded-3xl font-black shadow-2xl border-b-4 border-blue-800 active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center"
        >
          <span className="text-xs opacity-70 mb-1">继续挑战</span>
          <span className="text-xl">第 {progress.unlockedLevel} 关</span>
        </button>
      </div>
    </div>
  );
};

export default MapView;
