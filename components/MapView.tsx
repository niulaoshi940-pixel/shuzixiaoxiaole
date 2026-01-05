
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

  // Auto scroll to current level
  useEffect(() => {
    if (scrollRef.current) {
      const currentElement = document.getElementById(`level-node-${progress.unlockedLevel}`);
      if (currentElement) {
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback: scroll to bottom
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [progress.unlockedLevel]);

  // Generate path points
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    // Zigzag pattern
    const row = i;
    const x = 50 + Math.sin(i * 0.5) * 35; // 15% to 85% width
    const y = i * 120 + 60;
    points.push({ x, y });
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-sky-200">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full z-20 p-4 flex justify-between items-center bg-sky-400/80 backdrop-blur shadow-md">
        <button onClick={onBack} className="bg-white p-2 rounded-full shadow-lg pop-scale">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full text-blue-600 font-bold shadow-inner">
             <span className="text-xl">🏆</span>
             <span>{progress.unlockedLevel - 1}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full text-yellow-600 font-bold shadow-inner">
             <span className="text-xl">⭐</span>
             {/* Fix: Cast Object.values to number[] to avoid operator '+' cannot be applied to types 'unknown' error */}
             <span>{(Object.values(progress.stars) as number[]).reduce((a, b) => a + b, 0)}</span>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div 
        ref={scrollRef}
        className="h-full w-full overflow-y-auto no-scrollbar scroll-smooth pt-24 pb-24 flex flex-col items-center"
      >
        <div className="relative" style={{ height: `${TOTAL_LEVELS * 120}px`, width: '100%' }}>
          {/* SVG Path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <polyline
              points={points.map(p => `${p.x}%,${p.y}`).join(' ')}
              fill="none"
              stroke="white"
              strokeWidth="10"
              strokeDasharray="20,15"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>

          {/* Level Nodes */}
          {points.map((p, i) => {
            const levelId = TOTAL_LEVELS - i;
            const isUnlocked = levelId <= progress.unlockedLevel;
            const stars = progress.stars[levelId] || 0;
            const isCurrent = levelId === progress.unlockedLevel;

            return (
              <div
                key={levelId}
                id={`level-node-${levelId}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${100 - p.x}%`, top: `${p.y}px` }}
              >
                <button
                  onClick={() => onSelectLevel(levelId)}
                  disabled={!isUnlocked}
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl shadow-xl border-4 pop-scale
                    ${isCurrent ? 'bg-yellow-400 border-white scale-125 ring-4 ring-yellow-200 animate-pulse' : 
                      isUnlocked ? 'bg-blue-500 border-white text-white' : 
                      'bg-gray-400 border-gray-300 text-gray-200 cursor-not-allowed'}
                  `}
                >
                  {levelId}
                </button>
                {isUnlocked && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3].map(s => (
                      <span key={s} className={`text-lg ${s <= stars ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MapView;
