
import React, { useRef, useEffect, useMemo } from 'react';
import { UserProgress } from '../types';
import { TOTAL_LEVELS } from '../constants';

interface MapViewProps {
  progress: UserProgress;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

const MapView: React.FC<MapViewProps> = ({ progress, onSelectLevel, onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 核心间距设定
  const spacing = 140;
  // 底部留白（给起点地标）
  const bottomOffset = 600;
  // 顶部留白（给终点地标）
  const topOffset = 600;

  // 使用 useMemo 稳定坐标点
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      // x 坐标 0-100，y 坐标为绝对像素。i=0 是第1关，在底部
      const x = 50 + Math.sin(i * 0.6) * 18 + Math.cos(i * 0.3) * 5;
      // 第1关(i=0) 的 y 最大，在最下面。 y = (99 - 0) * 140 + topOffset
      const y = (TOTAL_LEVELS - 1 - i) * spacing + topOffset; 
      pts.push({ x, y });
    }
    return pts;
  }, [spacing, topOffset]);

  const totalHeight = (TOTAL_LEVELS - 1) * spacing + topOffset + bottomOffset;

  // 起点和终点坐标：确保间距也是一个 spacing
  const startPoint = useMemo(() => ({ x: 50, y: points[0].y + spacing }), [points, spacing]);
  const endPoint = useMemo(() => ({ x: 50, y: points[TOTAL_LEVELS - 1].y - spacing }), [points, spacing]);

  // 计算分段路径数据
  const pathData = useMemo(() => {
    const allPoints = [startPoint, ...points, endPoint];
    
    // 已解锁：从起点 -> 第1关 -> ... -> 当前关
    const unlockedIdx = progress.unlockedLevel; 
    const unlockedPts = [startPoint, ...points.slice(0, unlockedIdx)];
    
    // 待解锁：从当前关 -> ... -> 第100关 -> 终点
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

  // 自动定位到当前关卡
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
      {/* 顶部状态栏 */}
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

      {/* 地图滚动容器 */}
      <div ref={scrollRef} className="h-full w-full overflow-y-auto no-scrollbar scroll-smooth bg-[#f1f5f9]">
        <div className="relative mx-auto w-full max-w-2xl" style={{ height: `${totalHeight}px` }}>
          
          {/* SVG 路线 */}
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
            
            {/* 底层灰色宽带（国道） */}
            <path d={pathData.full} fill="none" stroke="#e2e8f0" strokeWidth="100" strokeLinecap="round" strokeLinejoin="round" />

            {/* 待挑战路径：深灰虚线 */}
            <path
              d={pathData.locked}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="12"
              strokeDasharray="25, 30"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40"
            />

            {/* 已完成路径：蓝色亮虚线 */}
            <path
              d={pathData.unlocked}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="20"
              strokeDasharray="30, 25"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-line)"
              className="opacity-90 transition-all duration-1000"
            />
          </svg>

          {/* 北京 (终点地标) */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-full flex justify-center z-10"
            style={{ left: `${endPoint.x}%`, top: `${endPoint.y}px` }}
          >
             <div className="bg-red-800 text-yellow-400 px-10 py-8 rounded-[3rem] font-black shadow-2xl border-4 border-yellow-500 flex flex-col items-center">
                <h3 className="text-5xl mb-1 tracking-widest">北京</h3>
                <p className="text-xs opacity-60 uppercase font-bold bg-red-900/50 px-3 py-1 rounded-full">Final Destination</p>
             </div>
          </div>

          {/* 关卡节点 */}
          {points.map((p, i) => {
            const levelId = i + 1;
            const isUnlocked = levelId <= progress.unlockedLevel;
            const stars = progress.stars[levelId] || 0;
            const isCurrent = levelId === progress.unlockedLevel;
            const dist = Math.abs(levelId - progress.unlockedLevel);
            const scale = isCurrent ? 1.8 : Math.max(0.7, 1.1 - (dist * 0.08));
            const opacity = isCurrent ? 1 : Math.max(0.5, 0.9 - (dist * 0.04));

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
                {/* 当前位置的小车提示 */}
                {isCurrent && (
                  <div className="absolute -top-14 z-50 animate-bounce">
                    <span className="text-5xl drop-shadow-xl">🚗</span>
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

                {/* 星级显示 */}
                {isUnlocked && !isCurrent && stars > 0 && (
                  <div className="mt-1 flex bg-white/70 px-1 py-0.5 rounded-full border border-blue-50 transform scale-75">
                    {[1, 2, 3].map(s => (
                      <span key={s} className={`text-xs ${s <= stars ? 'text-yellow-500' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* 米河镇 (起点地标) */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-full flex justify-center z-10"
            style={{ left: `${startPoint.x}%`, top: `${startPoint.y}px` }}
          >
             <div className="bg-slate-700 text-white px-8 py-6 rounded-[2.5rem] font-black shadow-xl border-4 border-slate-500 flex flex-col items-center opacity-90">
                <h3 className="text-3xl mb-1">米河镇</h3>
                <p className="text-[10px] opacity-60 tracking-widest uppercase">Start Point</p>
             </div>
          </div>

        </div>
      </div>

      {/* 底部浮动面板 */}
      <div className="absolute bottom-12 left-0 w-full px-6 flex justify-between items-center pointer-events-none z-[60]">
          {/* 进度显示 */}
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-3xl border-2 border-blue-500 shadow-2xl pointer-events-auto">
             <div className="text-blue-900 font-black text-[9px] opacity-60">REMAINING</div>
             <div className="text-lg font-black text-blue-600 tracking-tighter">
                {TOTAL_LEVELS - progress.unlockedLevel} <span className="text-[9px] text-gray-400 ml-1">STATIONS</span>
             </div>
          </div>

          {/* 中间挑战按钮 */}
          <button 
            onClick={() => onSelectLevel(progress.unlockedLevel)}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-blue-600 text-white px-8 py-3 rounded-full font-black shadow-2xl pointer-events-auto border-2 border-white animate-pulse mb-2 active:scale-95 transition-transform"
          >
            <div className="text-[10px] opacity-70">继续旅程</div>
            <div className="text-xl leading-none">第 {progress.unlockedLevel} 关</div>
          </button>

          {/* 快速回位按钮 */}
          <button 
            onClick={() => scrollToCurrent('smooth')}
            className="bg-blue-600 text-white w-16 h-16 rounded-2xl shadow-2xl flex flex-col items-center justify-center border-b-4 border-blue-800 active:translate-y-1 active:border-b-0 transition-all pointer-events-auto"
          >
            <span className="text-2xl">🎯</span>
            <span className="text-[8px] font-black">归位</span>
          </button>
      </div>
    </div>
  );
};

export default MapView;
