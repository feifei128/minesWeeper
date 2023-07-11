import { Ref } from "vue";
import { BlockState } from "~/types";

//计算附近有的炸弹 [directions/方向]
const directions = [
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

type GameStatus = "play" | "won" | "lost";
type GameDifficulty = "easy" | "medium" | "hard";
interface GameState {
  //定义一个 10*10的二维数组
  board: BlockState[][];
  mineGenerated: boolean;
  //先不生成，等第一下点击以后再生成代码
  status: GameStatus;
  startMS: number;
  endMS?: number;
  difficulty?: GameDifficulty;
}

export class GamePlay {
  state = ref() as Ref<GameState>;
  constructor(
    public width: number,
    public height: number,
    public mines: number
  ) {
    //开始就重置一次游戏
    this.reset();
  }

  get board() {
    return this.state.value.board;
  }

  //重置游戏状态
  reset(width = this.width, height = this.height, mines = this.mines) {
    this.width = width;
    this.height = height;
    this.mines = mines;

    this.state.value = {
      startMS: 0,
      mineGenerated: false,
      status: "play",
      board: Array.from({ length: this.height }, (_, y) =>
        Array.from(
          { length: this.width },
          (_, x): BlockState => ({
            x,
            y,
            adjacentMines: 0,
            revealed: false,
          })
        )
      ),
    };
  }

  //点击以后的效果
  onClick(block: BlockState) {
    if (this.state.value.status !== "play" || block.flagged) return;

    if (!this.state.value.mineGenerated) {
      //第一次点击以后再生成炸弹💣
      this.generateMines(this.board, block); //传点击的坐标过去！
      this.state.value.mineGenerated = true;
      this.state.value.startMS = +Date.now();
    }

    block.revealed = true; //点击以后就是翻开
    if (block.mine) {
      this.onGameOver("lost");
      return;
    }
    this.expendZero(block);
  }

  random(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  randomInt(min: number, max: number) {
    return Math.round(this.random(min, max));
  }
  //定义炸弹！【初始化，在计算炸弹的时候，在第一次点击的周围不要生成炸弹！】
  generateMines(state: BlockState[][], initial: BlockState) {
    const placeRandom = () => {
      const x = this.randomInt(0, this.width - 1);
      const y = this.randomInt(0, this.height - 1);
      const block = state[y][x];
      if (
        Math.abs(initial.x - block.x) <= 1 &&
        Math.abs(initial.y - block.y) <= 1
      ) {
        return false;
      }
      if (block.mine) {
        return false;
      }
      block.mine = true;
      return true;
    };
    Array.from({ length: this.mines }, () => null).forEach(() => {
      let placed = false;
      while (!placed) {
        placed = placeRandom();
      }
    });

    //initial 的【点击的坐标】
    // for (const row of state) {
    //   for (const block of row) {
    //     //如果第一下点击传过来的坐标x - 现在遍历的坐标x 左右正负都小于1 也就是在周围就continue!
    //     if (Math.abs(initial.x - block.x) < 1) {
    //       continue; //continue 就是跳过这个循环遍历 进行下一次遍历
    //     }
    //     if (Math.abs(initial.y - block.y) < 1) {
    //       //相同原理
    //       continue;
    //     }
    //     block.mine = Math.random() < 0.2;
    //   }
    // }
    this.updateNumbers();
  }

  //循环每一个【数】，然后把这个【数】加上上面的数值，就是它的 8个方位！
  updateNumbers() {
    this.board.forEach((row) => {
      row.forEach((block) => {
        if (block.mine) return;
        //当它是个炸弹，就短路！

        //然后计算它的各个范围的炸弹数量👇
        this.getSiblings(block) //它会返回这个坐标周围的那个坐标是炸弹的【数组】
          .forEach((b) => {
            //数组每一个元素就代表这个周围有多少个炸弹 就加1
            if (b.mine) block.adjacentMines += 1;
          });
      });
    });
  }

  //重构 - 把方向筛选的方法提取出来
  getSiblings(block: BlockState) {
    return directions
      .map(([dx, dy]) => {
        const x2 = block.x + dx;
        const y2 = block.y + dy;
        //如果x2已经超过框框就忽略它
        if (x2 < 0 || x2 >= this.width || y2 < 0 || y2 >= this.height)
          return undefined;

        //如果有炸弹 就在它的这个属性上加1
        // if (state[y2][x2].mine)
        //   block.adjacentMines += 1;

        return this.board[y2][x2]; //返回位置周围的<x,y>编号
      })
      .filter(Boolean) as BlockState[];
  }

  //右键
  onRightClick(block: BlockState) {
    if (this.state.value.status !== "play") return;

    if (block.revealed) return;
    block.flagged = !block.flagged;
  }

  //点击以后展开周围的0
  expendZero(block: BlockState) {
    if (block.adjacentMines) {
      //如果炸弹数值不为0 就直接返回
      return;
    }
    //以下代码是处理 数值为0的👇 对这个点的方向进行一个循环遍历！
    this.getSiblings(block).forEach((s) => {
      if (!s.revealed && !s.flagged) {
        s.revealed = true;
        this.expendZero(s);
      }
    });
  }

  //检查是否胜利
  checkGameState() {
    //如果没有还没有生成炸弹就先不要去判断
    if (!this.state.value.mineGenerated) return;

    const blocks = this.board.flat();

    //  所有坐标被翻开了或者标记上🚩了才返回【true】
    if (blocks.every((block) => block.revealed || block.flagged || block.mine))
      if (blocks.some((block) => block.flagged && !block.mine)) {
        //检查任何一个坐标【被标记】了并且【不是炸弹】的时候就返回 You cheat
        this.onGameOver("lost");
      } else {
        this.onGameOver("won");
      }
  }

  //踩到炸弹了
  showAllMines() {
    this.board.flat().forEach((i) => {
      if (i.mine && !i.flagged) i.revealed = true;
    });
  }

  //自动展开👇
  autoExpand(block: BlockState) {
    if (this.state.value.status !== "play" || block.flagged) return;
    const sliglings = this.getSiblings(block);
    const flags = sliglings.reduce((a, b) => a + (b.flagged ? 1 : 0), 0);
    const notRevealed = sliglings.reduce(
      (a, b) => a + (!b.revealed && !b.flagged ? 1 : 0),
      0
    );

    if (flags === block.adjacentMines) {
      sliglings.forEach((i) => {
        if (!i.flagged) {
          i.revealed = true;
          if (i.mine) {
            this.onGameOver("lost");
          }
        }
      });
    }
    const missingFlags = block.adjacentMines - flags;
    if (notRevealed === missingFlags) {
      sliglings.forEach((i) => {
        if (!i.revealed && !i.flagged) {
          i.flagged = true;
        }
      });
    }
  }

  //游戏结束！
  onGameOver(status: GameStatus) {
    this.state.value.status = status;
    this.state.value.endMS = +Date.now();
    if (status === "lost") {
      this.showAllMines();
    }
  }
}
