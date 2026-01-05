
import React from 'react';

interface HomeProps {
  onStart: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="floating mb-12">
        <h1 className="text-6xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] tracking-widest"
            style={{ WebkitTextStroke: '2px #2563eb' }}>
          数学消消乐
        </h1>
        <p className="text-2xl text-blue-800 font-bold mt-2">冒险之路</p>
      </div>

      <div className="space-y-6 w-full max-w-xs">
        <button 
          onClick={onStart}
          className="w-full bg-yellow-400 border-b-8 border-yellow-600 text-yellow-900 text-3xl font-black py-4 rounded-2xl pop-scale shadow-lg"
        >
          开始挑战
        </button>
        
        <div className="bg-white/40 backdrop-blur-sm p-4 rounded-2xl text-blue-900 font-bold border-2 border-white/50">
          <p>🔢 发现数字公式 A + B = C</p>
          <p>🏆 解锁 100 个精彩关卡</p>
          <p>❄️ 破解冰块与锁定的障碍</p>
        </div>
      </div>

      <div className="mt-12 text-blue-600/60 font-medium">
        东竹园小学 · 创意数学工坊
      </div>
    </div>
  );
};

export default Home;
