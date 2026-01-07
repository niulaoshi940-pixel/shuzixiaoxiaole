
import React, { useRef, useEffect, useMemo } from 'react';
import { UserProgress } from '../types';
import { TOTAL_LEVELS, LEVEL_NAMES } from '../constants';

// 戴红领巾的阳光小学生头像组件
const SunnyStudentAvatar: React.FC = () => {
  return (
    <div className="relative w-20 h-20 animate-walk flex items-center justify-center scale-125 drop-shadow-[0_12px_24px_rgba(239,68,68,0.3)]">
      {/* 底部柔和阴影 */}
      <div className="absolute -bottom-2 w-12 h-3 bg-red-900/10 rounded-full blur-[4px]"></div>
      
      {/* 头像容器 */}
      <div className="relative w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-gradient-to-tr from-blue-50 to-blue-100 flex items-center justify-center shadow-inner">
        {/* 背景装饰线 */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_12s_linear_infinite]">
                <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,8" fill="none" />
            </svg>
        </div>

        {/* 小学生头像 SVG */}
        <svg width="70" height="70" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="z-10 translate-y-2">
          {/* 脸部 */}
          <circle cx="40" cy="40" r="28" fill="#FFDBAC"/>
          
          {/* 头发 - 阳光棕色 */}
          <path d="M12 40C12 25 22 10 40 10C58 10 68 25 68 40" stroke="#5C4033" strokeWidth="8" strokeLinecap="round" />
          <path d="M15 35C15 20 25 15 40 15C55 15 65 20 65 35" fill="#5C4033" />
          
          {/* 腮红 */}
          <circle cx="26" cy="48" r="5" fill="#FF9999" opacity="0.5"/>
          <circle cx="54" cy="48" r="5" fill="#FF9999" opacity="0.5"/>
          
          {/* 亮晶晶的眼睛 */}
          <circle cx="30" cy="42" r="4" fill="#333"/>
          <circle cx="50" cy="42" r="4" fill="#333"/>
          <circle cx="28.5" cy="40.5" r="1.5" fill="white"/>
          <circle cx="48.5" cy="40.5" r="1.5" fill="white"/>
          
          {/* 灿烂的笑容 */}
          <path d="M33 53C33 53 36 57 40 57C44 57 47 53 47 53" stroke="#8B4513" strokeWidth="2" strokeLinecap="round"/>
          
          {/* 校服衣领 */}
          <path d="M25 65L40 70L55 65" stroke="white" strokeWidth="8" strokeLinecap="round"/>
          
          {/* 重点：红领巾 */}
          <path d="M28 66L40 74L52 66L44 80L36 80L28 66Z" fill="#EF4444" />
          <path d="M35 68C35 68 38 72 40 72C42 72 45 68 45 68" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round"/>
          
          {/* 小黄帽装饰 */}
          <path d="M25 18C25 18 30 12 40 12C50 12 55 18" stroke="#FACC15" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      </div>

      {/* 能量星星装饰 */}
      <div className="absolute -top-1 -right-1 bg-yellow-400 text-white w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center animate-bounce">
         <span className="text-[10px]">★</span>
      </div>
    </div>
  );
};

interface MapViewProps {
  progress: UserProgress;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

const MapView: React.FC<MapViewProps> = ({ progress, onSelectLevel, onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const spacing = 160; 
  const bottomOffset = 600;
  const topOffset = 600;

  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const x = 50 + Math.sin(i * 0.6) * 18 + Math.cos(i * 0.3) * 5;
      const y = (TOTAL_LEVELS - 1 - i) * spacing + topOffset; 
      pts.push({ x, y });
    }
    return pts;
  }, [spacing, topOffset]);

  const totalHeight = (TOTAL_LEVELS - 1) * spacing + topOffset + bottomOffset;

  const startPoint = useMemo(() => ({ x: 50, y: points[0].y + spacing }), [points, spacing]);
  const endPoint = useMemo(() => ({ x: 50, y: points[TOTAL_LEVELS - 1].y - spacing }), [points, spacing]);

  const pathData = useMemo(() => {
    const allPoints = [startPoint, ...points, endPoint];
    const unlockedIdx = progress.unlockedLevel; 
    const unlockedPts = [startPoint, ...points.slice(0, unlockedIdx)];
    const lockedPts = [...points.slice(unlockedIdx - 1), endPoint];

    const createD = (pts: { x: number; y: number }[]) => {
      if (pts.length < 2) return "";
      return `M ${pts[0].x * 10} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x * 10} ${p.y}`).join(' ');
    };

    return {
      full: createD(allPoints),
      unlocked: createD(unlockedPts),
      locked: createD(lockedPts)
    };
  }, [points, startPoint, endPoint, progress.unlockedLevel]);

  const scrollToCurrent = (behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current) return;
    const targetPoint = points[progress.unlockedLevel - 1];
    if (targetPoint) {
      const containerHeight = scrollRef.current.clientHeight;
      scrollRef.current.scrollTo({
        top: targetPoint.y - containerHeight / 2,
        behavior: behavior
      });
    }
  };

  useEffect(() => {
    scrollToCurrent('auto');
    const timer = setTimeout(() => scrollToCurrent('smooth'), 500);
    return () => clearTimeout(timer);
  }, [progress.unlockedLevel]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-[#e2e8f0]">
      <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-end bg-gradient-to-b from-red-800 to-red-700/90 border-b-4 border-yellow-500 shadow-2xl backdrop-blur-sm">
        <button onClick={onBack} className="bg-yellow-500 text-red-900 p-3 rounded-2xl shadow-lg active:scale-90 transition-transform border-2 border-white/20">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex-1 text-center px-4">
            <h1 className="text-4xl font-black text-white tracking-widest drop-shadow-xl uppercase">进京地图</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
                <span className="bg-red-900/50 text-yellow-300 text-[10px] px-2 py-0.5 rounded border border-yellow-500/30 font-bold">MILU RIVER → BEIJING</span>
            </div>
        </div>

        <div className="bg-white/10 px-4 py-2 rounded-2xl border-2 border-yellow-500/30 flex items-center gap-2">
            <span className="text-2xl font-black text-yellow-400">{Object.values(progress.stars).reduce((a, b) => (a as number) + (b as number), 0)}</span>
            <span className="text-xl">⭐</span>
        </div>
      </div>

      <div ref={scrollRef} className="h-full w-full overflow-y-auto no-scrollbar scroll-smooth bg-[#f1f5f9]">
        <div className="relative mx-auto w-full max-w-2xl" style={{ height: `${totalHeight}px` }}>
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 1000 ${totalHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="glow-line">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d={pathData.full} fill="none" stroke="#e2e8f0" strokeWidth="100" strokeLinecap="round" strokeLinejoin="round" />
            <path d={pathData.locked} fill="none" stroke="#94a3b8" strokeWidth="12" strokeDasharray="25, 30" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
            <path d={pathData.unlocked} fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="30, 25" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-line)" className="opacity-90 transition-all duration-1000" />
          </svg>

          <div className="absolute transform -translate-x-1/2 -translate-y-1/2 w-full flex justify-center z-10" style={{ left: `${endPoint.x}%`, top: `${endPoint.y}px` }}>
             <div className="bg-red-800 text-yellow-400 px-10 py-8 rounded-[3rem] font-black shadow-2xl border-4 border-yellow-500 flex flex-col items-center">
                <h3 className="text-5xl mb-1 tracking-widest">北京</h3>
                <p className="text-xs opacity-60 uppercase font-bold bg-red-900/50 px-3 py-1 rounded-full text-center">{LEVEL_NAMES[99]}</p>
             </div>
          </div>

          {points.map((p, i) => {
            const levelId = i + 1;
            const isUnlocked = levelId <= progress.unlockedLevel;
            const stars = progress.stars[levelId] || 0;
            const isCurrent = levelId === progress.unlockedLevel;
            const locationName = LEVEL_NAMES[i] || `第${levelId}站`;
            const dist = Math.abs(levelId - progress.unlockedLevel);
            const scale = isCurrent ? 1.8 : Math.max(0.7, 1.1 - (dist * 0.08));
            const opacity = isCurrent ? 1 : Math.max(0.3, 0.9 - (dist * 0.04));

            return (
              <div
                key={levelId}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500"
                style={{ 
                    left: `${p.x}%`, 
                    top: `${p.y}px`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    opacity: opacity,
                    zIndex: isCurrent ? 50 : 20 - Math.min(dist, 10)
                }}
              >
                {isCurrent && (
                  <div className="absolute -top-16 z-50">
                    <SunnyStudentAvatar />
                  </div>
                )}

                <button
                  onClick={() => onSelectLevel(levelId)}
                  disabled={!isUnlocked}
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center font-black shadow-xl border-b-4 transition-all relative
                    ${isCurrent ? 'bg-blue-600 border-blue-900 text-white ring-8 ring-blue-100' : 
                      isUnlocked ? 'bg-white border-blue-200 text-blue-700' : 
                      'bg-gray-200 border-gray-300 text-gray-400 opacity-60'}
                  `}
                  style={{ fontSize: isCurrent ? '1.8rem' : '1.3rem' }}
                >
                  {levelId}
                </button>

                {/* 修改处：将 text-blue-900/40 改为 text-blue-950 以加深非当前站点的文字颜色 */}
                <div className={`
                  absolute top-full mt-2 whitespace-nowrap px-3 py-1 rounded-full font-bold transition-all
                  ${isCurrent ? 'bg-blue-600 text-white text-base shadow-lg z-50' : 'text-blue-950 text-[11px]'}
                `}>
                  {locationName}
                </div>

                {isUnlocked && !isCurrent && stars > 0 && (
                  <div className="mt-6 flex bg-white/70 px-1 py-0.5 rounded-full border border-blue-50 transform scale-75">
                    {[1, 2, 3].map(s => (
                      <span key={s} className={`text-xs ${s <= stars ? 'text-yellow-500' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="absolute transform -translate-x-1/2 -translate-y-1/2 w-full flex justify-center z-10" style={{ left: `${startPoint.x}%`, top: `${startPoint.y}px` }}>
             <div className="bg-slate-700 text-white px-8 py-6 rounded-[2.5rem] font-black shadow-xl border-4 border-slate-500 flex flex-col items-center opacity-90">
                <h3 className="text-3xl mb-1">米河镇</h3>
                <p className="text-[10px] opacity-60 tracking-widest uppercase">{LEVEL_NAMES[0]}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-0 w-full px-6 flex justify-between items-center pointer-events-none z-[60]">
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-3xl border-2 border-blue-500 shadow-2xl pointer-events-auto">
             <div className="text-blue-900 font-black text-[9px] opacity-60">NEXT STOP</div>
             <div className="text-lg font-black text-blue-600 tracking-tighter max-w-[120px] truncate">
                {LEVEL_NAMES[progress.unlockedLevel - 1]}
             </div>
          </div>

          <button 
            onClick={() => onSelectLevel(progress.unlockedLevel)}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-blue-600 text-white px-8 py-3 rounded-full font-black shadow-2xl pointer-events-auto border-2 border-white animate-pulse mb-2 active:scale-95 transition-transform"
          >
            <div className="text-[10px] opacity-70">继续前进</div>
            <div className="text-xl leading-none">第{progress.unlockedLevel}站</div>
          </button>

          <button onClick={() => scrollToCurrent('smooth')} className="bg-blue-600 text-white w-16 h-16 rounded-2xl shadow-2xl flex flex-col items-center justify-center border-b-4 border-blue-800 active:translate-y-1 active:border-b-0 transition-all pointer-events-auto">
            <span className="text-2xl">🏃‍♂️</span>
            <span className="text-[8px] font-black">定位</span>
          </button>
      </div>
    </div>
  );
};

export default MapView;
