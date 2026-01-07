
import React from 'react';

interface HomeProps {
  onStart: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#fff5f5] to-[#ffe3e3] overflow-hidden">
      {/* 顶部装饰元素 */}
      <div className="absolute top-10 left-0 w-full flex justify-around opacity-20 pointer-events-none">
        <span className="text-6xl">🎈</span>
        <span className="text-6xl mt-12">🎈</span>
        <span className="text-6xl">🎈</span>
      </div>

      <div className="floating relative mb-16 px-2">
        {/* 标题背后的光晕效果 */}
        <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full scale-150"></div>
        
        <h1 
          className="relative z-10 text-5xl sm:text-8xl font-black tracking-tight whitespace-nowrap px-4"
          style={{ 
            color: '#e11d48', // 亮红色
            WebkitTextStroke: '2.5px #ffffff',
            paintOrder: 'stroke fill',
            textShadow: `
              0 2px 0 #be123c,
              0 4px 0 #9f1239,
              0 6px 0 #881337,
              0 8px 0 #4c0519,
              0 12px 20px rgba(0,0,0,0.4),
              0 0 40px rgba(251,191,36,0.3)
            `
          }}
        >
          数学进京路
        </h1>
        
        <div className="relative z-10 mt-6 inline-block bg-gradient-to-r from-red-600 to-red-800 text-white px-8 py-2 rounded-full shadow-lg border-2 border-yellow-400 rotate-1">
          <p className="text-xl sm:text-3xl font-black italic tracking-widest">
            千里之路 <span className="text-yellow-400 mx-1">★</span> 始于米河
          </p>
        </div>
      </div>

      <div className="space-y-10 w-full max-w-sm relative z-20">
        <button 
          onClick={onStart}
          className="group w-full bg-gradient-to-b from-red-500 to-red-700 border-b-[12px] border-red-900 text-white text-4xl sm:text-5xl font-black py-6 rounded-[3rem] pop-scale shadow-2xl active:translate-y-2 active:border-b-4 transition-all relative overflow-hidden"
        >
          {/* 按钮流光特效 */}
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000"></div>
          启程赴京
        </button>
        
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-[2.5rem] text-red-900 font-black border-4 border-yellow-200 shadow-xl space-y-3 text-lg sm:text-xl relative">
          <div className="absolute -top-4 -right-4 bg-yellow-400 text-red-900 text-xs px-3 py-1 rounded-full border-2 border-white shadow-md rotate-12">NEW!</div>
          <p className="flex items-center justify-center gap-2">
            <span className="bg-red-100 p-1 rounded-lg">📍</span> 出发地：河南 · 米河
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="bg-red-100 p-1 rounded-lg">🏛️</span> 目的地：首都 · 北京
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="bg-red-100 p-1 rounded-lg">📝</span> 解决 100 道数学难题
          </p>
        </div>
      </div>

      <div className="mt-16 relative">
        <div className="absolute inset-0 bg-white/50 blur-xl"></div>
        <div className="relative text-red-700 font-black text-xl sm:text-3xl tracking-tighter drop-shadow-md px-8 py-3 rounded-full border-2 border-red-200/50 whitespace-nowrap bg-white/40">
          东竹园小学 <span className="text-red-400 mx-1">|</span> 创意数学工坊
        </div>
      </div>
    </div>
  );
};

export default Home;
