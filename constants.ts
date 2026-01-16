
import { GameMode, BlockType, LevelConfig } from './types';

export const TOTAL_LEVELS = 100;

export const REGIONS = [
  { name: "中原大地", start: 1, end: 42, color: "from-green-100 to-yellow-50", icon: "🌾" },
  { name: "燕赵雄风", start: 43, end: 83, color: "from-yellow-50 to-orange-50", icon: "🏯" },
  { name: "京城门户", start: 84, end: 100, color: "from-red-50 to-red-100", icon: "🏯" }
];

export const CHEST_LEVELS = [10, 25, 42, 60, 75, 83, 95];

export const LEVEL_NAMES = [
  "米河镇(起点)", "米河镇小里河村", "荥阳泗水镇", "荥阳高山镇", "荥阳豫龙镇", 
  "荥阳市区", "郑州西三环", "郑州火车站", "郑州紫荆山", "郑东新区",
  "郑州黄河大桥南", "郑州黄河大桥北", "原阳桥北乡", "原阳县城", "原阳祝楼乡",
  "新乡平原新区", "新乡大召营", "新乡中心", "新乡牧野", "凤泉潞王坟",
  "卫辉市区", "卫辉唐庄", "卫辉汲城", "淇县高村", "淇县庙口",
  "淇县北阳", "淇县西岗", "淇滨上葛村", "金山办事处", "石林镇",
  "宜沟镇北", "汤阴韩庄", "汤阴县城南", "羑里城", "淇县县城",
  "鹤壁淇滨区", "鹤戴戴店", "汤阴县城", "宜沟镇", "安阳文峰",
  "安阳北关", "安阳柏庄", "临漳(冀豫界)", "磁县县城", "邯郸南部",
  "邯郸丛台", "邯郸联纺路", "永年区", "永年界河店", "沙河褡裢",
  "邢台南和", "邢台开元寺", "邢台内丘", "内丘官庄", "临城县城",
  "柏乡县城", "高邑县城", "元氏县城", "元氏槐阳", "石家庄栾城",
  "石家庄裕华", "人民广场", "正定古城", "正定机场", "新乐市区",
  "新乐承安", "定州庞村", "定州南关", "定州市区", "定州望亭",
  "望都县城", "望都中韩庄", "清苑区", "总督署", "保定徐水",
  "徐水遂城", "定兴县城", "定兴北河", "高碑店市区", "白沟",
  "涿州松林店", "涿州市区", "涿州影视城", "琉璃河(进京)", "房山窦店",
  "房山良乡", "京深长阳", "丰台云岗", "宛平城", "卢沟桥",
  "岳各庄", "西四环大井", "万寿路", "公主坟", "军事博物馆",
  "木樨地", "复兴门", "西单", "府右街", "天安门(终点)"
];

export const getLevelConfig = (levelId: number): LevelConfig => {
  let mode = GameMode.ADDITION;
  let maxVal = 10;
  
  // 1-40关保持原有逻辑
  if (levelId <= 10) { mode = GameMode.ADDITION; maxVal = 10; }
  else if (levelId <= 20) { mode = GameMode.SUBTRACTION; maxVal = 10; }
  else if (levelId <= 30) { mode = GameMode.ADDITION; maxVal = 20; }
  else if (levelId <= 40) { mode = GameMode.SUBTRACTION; maxVal = 20; }
  
  // 41-50: 30以内加法
  else if (levelId <= 50) { mode = GameMode.ADDITION; maxVal = 30; }
  // 51-60: 30以内减法
  else if (levelId <= 60) { mode = GameMode.SUBTRACTION; maxVal = 30; }
  // 61-70: 和为30的三个数连减 (Target Sum 模式，目标30)
  else if (levelId <= 70) { mode = GameMode.TARGET_SUM; maxVal = 30; }
  // 71-80: 同上
  else if (levelId <= 80) { mode = GameMode.TARGET_SUM; maxVal = 30; }
  // 81-90: 50以内加法
  else if (levelId <= 90) { mode = GameMode.ADDITION; maxVal = 50; }
  // 91-100: 100以内加法
  else { mode = GameMode.ADDITION; maxVal = 100; }

  let gridSize = 4;
  let timeLimit = 40;

  if (levelId <= 5) { gridSize = 4; timeLimit = 40; }
  else if (levelId <= 7) { gridSize = 5; timeLimit = 60; }
  else if (levelId <= 10) { gridSize = 6; timeLimit = 60; }
  else if (levelId <= 15) { gridSize = 5; timeLimit = 70; }
  else if (levelId <= 20) { gridSize = 6; timeLimit = 80; }
  else if (levelId <= 24) { gridSize = 5; timeLimit = 80; }
  else if (levelId <= 27) { gridSize = 6; timeLimit = 90; }
  else if (levelId <= 30) { gridSize = 7; timeLimit = 90; }
  else if (levelId <= 40) { gridSize = 6; timeLimit = 100; }
  else if (levelId <= 45) { gridSize = 5; timeLimit = 110; }
  else if (levelId <= 50) { gridSize = 6; timeLimit = 120; }
  else if (levelId <= 55) { gridSize = 5; timeLimit = 120; }
  else if (levelId <= 60) { gridSize = 6; timeLimit = 125; }
  else if (levelId <= 70) { gridSize = 5; timeLimit = 125; }
  else if (levelId <= 80) { gridSize = 6; timeLimit = 130; }
  else if (levelId <= 90) { gridSize = 6; timeLimit = 140; }
  else if (levelId <= 95) { gridSize = 6; timeLimit = 145; }
  else { gridSize = 7; timeLimit = 160; } // 96-100

  return {
    id: levelId,
    mode,
    maxVal,
    gridSize,
    timeLimit,
    targetStars: [1000, 3000, 6000],
    distractorRate: Math.min(0.3, levelId / 300),
    specialRates: {
      [BlockType.ICE]: levelId > 5 ? 0.1 : 0,
      [BlockType.LOCKED]: levelId > 20 ? 0.1 : 0,
      [BlockType.BOMB]: 0.05
    }
  };
};
