
import React from 'react';

interface HomeProps {
  onStart: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#fdf2f2]">
      <div className="floating mb-12">
        <h1 
          className="text-7xl font-black text-[#b91c1c] tracking-widest"
          style={{ 
            WebkitTextStroke: '2px #ffffff',
            textShadow: `
              0 1px 0 #cccccc,
              0 2px 0 #c5c5c5,
              0 3px 0 #bbbbbb,
              0 4px 0 #b1b1b1,
              0 5px 0 #aaaaaa,
              0 6px 1px rgba(0,0,0,.1),
              0 0 5px rgba(0,0,0,.1),
              0 1px 3px rgba(0,0,0,.3),
              0 3px 5px rgba(0,0,0,.2),
              0 5px 10px rgba(0,0,0,.25),
              0 10px 10px rgba(0,0,0,.2),
              0 20px 20px rgba(0,0,0,.15)
            `
          }}
        >
          数学进京路
        </h1>
        <p className="text-3xl text-red-800 font-black mt-8 drop-shadow-sm italic">千里之路 · 始于米河</p>
      </div>

      <div className="space-y-8 w-full max-w-xs">
        <button 
          onClick={onStart}
          className="w-full bg-red-600 border-b-[10px] border-red-800 text-white text-4xl font-black py-6 rounded-3xl pop-scale shadow-2xl active:translate-y-2 active:border-b-4 transition-all"
        >
          启程赴京
        </button>
        
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] text-red-900 font-black border-4 border-red-100 shadow-xl space-y-2 text-xl">
          <p>📍 出发地：河南 · 米河</p>
          <p>🏛️ 目的地：首都 · 北京</p>
          <p>📝 解决 100 道数学难题</p>
        </div>
      </div>

      <div className="mt-20 text-red-700 font-black text-xl sm:text-4xl tracking-tighter drop-shadow-md bg-white/30 px-6 py-2 rounded-full border border-red-200/50 whitespace-nowrap">
        东竹园小学 · 创意数学工坊
      </div>
    </div>
  );
};

export default Home;
