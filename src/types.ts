//定义每个棋子的属性！
export interface BlockState {
  x: number;
  y: number;
  revealed: boolean; //revealed揭露【是否翻开】
  mine?: boolean; //mine矿 - 【是否雷】
  flagged?: boolean; //标记 【是否标记】
  adjacentMines: number; //临近的矿【附近有多少雷】
}
