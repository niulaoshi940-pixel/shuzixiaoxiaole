
import { GameMode, BlockType, LevelConfig } from './types';

export const TOTAL_LEVELS = 100;

export const LEVEL_NAMES = [
  "米河镇(起点)", "米河镇小里河村", "荥阳泗水镇", "荥阳高山镇", "荥阳豫龙镇", 
  "荥阳市区(索河路)", "郑州西三环", "郑州火车站", "郑州紫荆山广场", "郑东新区花园路",
  "郑州黄河大桥南", "郑州黄河大桥北", "原阳县桥北乡", "原阳县城", "原阳祝楼乡",
  "新乡市平原新区", "新乡大召营镇", "新乡市中心(胖东来)", "新乡牧野区", "凤泉区潞王坟",
  "卫辉市区", "卫辉唐庄镇", "卫辉汲城镇", "淇县高村镇", "淇县庙口镇",
  "淇县北阳镇", "淇县西岗镇", "淇滨区上葛村", "鹤壁金山办事处", "鹤壁石林镇",
  "汤阴宜沟镇北", "汤阴韩庄镇", "汤阴县城南", "汤阴羑里城", "淇县县城",
  "鹤壁市淇滨区", "鹤壁北戴店", "汤阴县城", "宜沟镇", "安阳文峰区",
  "安阳北关区", "安阳柏庄镇", "临漳县(冀豫界)", "磁县县城", "邯郸南部开发区",
  "邯郸市中心(丛台)", "邯郸联纺路", "永年区", "永年界河店", "沙河市褡裢镇",
  "邢台南和区", "邢台市中心(开元寺)", "邢台内丘县", "内丘官庄镇", "临城县城",
  "柏乡县城", "高邑县城", "元氏县城", "元氏槐阳镇", "石家庄栾城区",
  "石家庄裕华区", "石家庄市中心(人民广场)", "正定古城", "正定机场路口", "新乐市区",
  "新乐承安镇", "定州庞村镇", "定州南关", "定州市区", "定州望亭镇",
  "望都县城", "望都中韩庄", "清苑区", "保定市中心(总督署)", "保定徐水区",
  "徐水遂城镇", "定兴县城", "定兴北河镇", "高碑店市区", "高碑店白沟",
  "涿州松林店镇", "涿州市区", "涿州影视城", "琉璃河(进京首站)", "房山区窦店镇",
  "房山区良乡", "京深路长阳段", "丰台区云岗", "丰台区宛平城", "卢沟桥",
  "丰台区岳各庄", "西四环大井", "万寿路", "公主坟", "军事博物馆",
  "木樨地", "复兴门", "西单", "府右街南口", "天安门广场(终点)"
];

export const ITEM_COSTS = {
  hint: 50,
  freeze: 80,
  bomb: 100,
  refresh: 60
};

export const getLevelConfig = (levelId: number): LevelConfig => {
  let mode = GameMode.ADDITION;
  let maxVal = 10;
  
  if (levelId <= 10) {
    mode = GameMode.ADDITION;
    maxVal = 10;
  } else if (levelId <= 20) {
    mode = GameMode.SUBTRACTION;
    maxVal = 10;
  } else if (levelId <= 30) {
    mode = GameMode.ADDITION;
    maxVal = 20;
  } else if (levelId <= 40) {
    mode = GameMode.SUBTRACTION;
    maxVal = 20;
  } else if (levelId <= 50) {
    mode = GameMode.ADDITION;
    maxVal = 50;
  } else if (levelId <= 60) {
    mode = GameMode.SUBTRACTION;
    maxVal = 50;
  } else {
    mode = GameMode.ADDITION;
    maxVal = 100;
  }

  let gridSize = 4;
  if (levelId > 10) gridSize = 5;
  if (levelId > 30) gridSize = 6;
  if (levelId > 50) gridSize = 7;
  if (levelId > 75) gridSize = 8;
  if (levelId > 90) gridSize = 9;

  // 根据阶梯设定时间
  let timeLimit = 100;
  if (levelId <= 10) timeLimit = 100;
  else if (levelId <= 20) timeLimit = 90;
  else if (levelId <= 30) timeLimit = 120;
  else if (levelId <= 40) timeLimit = 110;
  else if (levelId <= 60) timeLimit = 105;
  else if (levelId <= 80) timeLimit = 100;
  else if (levelId <= 100) timeLimit = 90;

  const distractorRate = Math.min(0.5, (levelId / 180));
  
  const specialRates: any = {};
  if (levelId > 8) specialRates[BlockType.ICE] = Math.min(0.25, levelId * 0.006);
  if (levelId > 20) specialRates[BlockType.LOCKED] = Math.min(0.2, levelId * 0.005);
  
  // 确保第一关有炸弹方块出现的概率，后续关卡从40关开始再次出现并增加
  if (levelId === 1) {
    specialRates[BlockType.BOMB] = 0.1; 
  } else if (levelId > 40) {
    specialRates[BlockType.BOMB] = Math.min(0.15, levelId * 0.004);
  }

  return {
    id: levelId,
    mode,
    maxVal,
    gridSize,
    timeLimit,
    targetStars: [1000, 3000, 6000],
    distractorRate,
    specialRates
  };
};
