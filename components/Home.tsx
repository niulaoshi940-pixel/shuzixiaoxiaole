
import React, { useState } from 'react';

interface HomeProps {
  onStart: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => {
  const [showStory, setShowStory] = useState(false);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#fff5f5] to-[#ffe3e3] overflow-hidden relative">
      {/* 顶部装饰元素 */}
      <div className="absolute top-10 left-0 w-full flex justify-around opacity-20 pointer-events-none">
        <span className="text-6xl">🎈</span>
        <span className="text-6xl mt-12">🎈</span>
        <span className="text-6xl">🎈</span>
      </div>

      <div className="floating relative mb-12 px-2">
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
          <p className="text-xl sm:text-3xl font-black italic tracking-widest uppercase">
            英雄集结 <span className="text-yellow-400 mx-1">★</span> 远征开始
          </p>
        </div>
      </div>

      <div className="space-y-6 w-full max-w-sm relative z-20">
        <button 
          onClick={onStart}
          className="group w-full bg-gradient-to-b from-red-500 to-red-700 border-b-[12px] border-red-900 text-white text-4xl sm:text-5xl font-black py-6 rounded-[3rem] pop-scale shadow-2xl active:translate-y-2 active:border-b-4 transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000"></div>
          启程赴京
        </button>
        
        <button 
          onClick={() => setShowStory(true)}
          className="w-full bg-white/90 backdrop-blur-md p-4 rounded-[2rem] text-red-900 font-black border-4 border-yellow-200 shadow-xl flex items-center justify-center gap-3 text-xl pop-scale hover:bg-yellow-50 transition-colors"
        >
          <span className="text-3xl">📜</span> 查看通关指南
        </button>
      </div>

      {/* 冒险故事弹窗 */}
      {showStory && (
        <div className="absolute inset-0 z-[100] bg-red-950/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl border-8 border-yellow-400 relative scale-in">
            <button 
              onClick={() => setShowStory(false)}
              className="absolute -top-6 -right-6 bg-red-600 text-white w-12 h-12 rounded-full border-4 border-white text-3xl font-black shadow-lg flex items-center justify-center active:scale-90 transition-transform"
            >
              ×
            </button>
            
            <div className="text-center space-y-4">
              <div className="text-5xl">🎒</div>
              <h2 className="text-3xl font-black text-red-600 italic">通关法宝指南</h2>
              
              <div className="space-y-4 text-left font-bold text-gray-700 leading-relaxed overflow-y-auto max-h-[50vh] pr-2 no-scrollbar">
                <div className="bg-yellow-50 p-3 rounded-2xl border-l-4 border-yellow-400 flex items-start gap-3">
                  <span className="text-3xl">💡</span>
                  <div>
                    <span className="text-lg text-red-600 font-black">提示</span>
                    <p className="text-sm">找不到答案？点击它，自动帮你找到一组可以消除的数字！</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-2xl border-l-4 border-blue-400 flex items-start gap-3">
                  <span className="text-3xl">⏸️</span>
                  <div>
                    <span className="text-lg text-blue-600 font-black">暂停</span>
                    <p className="text-sm">时间不够了？让时间停止8秒钟！注意：暂停时不能消除哦。</p>
                  </div>
                </div>

                <div className="bg-red-50 p-3 rounded-2xl border-l-4 border-red-400 flex items-start gap-3">
                  <span className="text-3xl">💣</span>
                  <div>
                    <span className="text-lg text-red-600 font-black">炸弹</span>
                    <p className="text-sm">遇到困难？直接炸掉3个方块，并且瞬间获得大量分数！</p>
                  </div>
                </div>

                <div className="bg-orange-50 p-3 rounded-2xl border-l-4 border-orange-400 flex items-start gap-3">
                  <span className="text-3xl">🔄</span>
                  <div>
                    <span className="text-lg text-orange-600 font-black">刷新</span>
                    <p className="text-sm">数字太乱？点击刷新，把剩下的数字全部重新排列组合！</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowStory(false)}
                className="w-full bg-red-600 text-white py-4 rounded-2xl text-2xl font-black shadow-lg active:scale-95 transition-transform mt-4"
              >
                我知道了！
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 relative">
        <div className="absolute inset-0 bg-white/50 blur-xl"></div>
        <div className="relative text-red-700 font-black text-xl sm:text-3xl tracking-tighter drop-shadow-md px-8 py-3 rounded-full border-2 border-red-200/50 whitespace-nowrap bg-white/40">
          东竹园小学 <span className="text-red-400 mx-1">|</span> 创意数学工坊
        </div>
      </div>
    </div>
  );
};

export default Home;
