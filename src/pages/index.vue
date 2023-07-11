<script setup lang="ts">
// import { isDev, toggleDev } from "~/composables";
import { GamePlay } from "~/composables/logic";

const play = new GamePlay(9, 9, 10); //横坐标 纵坐标 炸弹数量
useStorage("XGGameMinesweeperState", play.state);
const state = $computed(() => play.board);

function newGame(difficulty: "easy" | "medium" | "hard") {
  switch (difficulty) {
    case "easy":
      play.reset(9, 9, 10);
      break;
    case "medium":
      play.reset(16, 16, 40);
      break;
    case "hard":
      play.reset(30, 16, 99);
      break;
  }
}

//计时
const now = $(useNow());
const timeMs = $computed(() =>
  Math.round(
    ((play.state.value.endMS || +now) - play.state.value.startMS) / 1000
  )
);

//监听 游戏状态：胜利/失败
watchEffect(() => {
  play.checkGameState();
});
</script>

<template>
  <div>
    XGGame - Minesweeper

    <div flex="~ gap1" justify-center p4>
      <button btn @click="play.reset()">重新开始</button>
      <button btn @click="newGame('easy')">简单</button>
      <button btn @click="newGame('medium')">中等</button>
      <button btn @click="newGame('hard')">困难</button>
    </div>

    <div flex justify-center>
      <div font-mono text-2xl flex="~ gap-1" items-center>
        <div i-carbon-timer></div>
        {{ play.state.value.mineGenerated ? timeMs : '0'}}
      </div>
    </div>

    <div p5 w-full overflow-auto>
      <div
        v-for="(row, y) in state"
        :key="y"
        flex="~"
        items-center
        justify-center
        w-max
        ma
      >
        <MineBlock
          v-for="(block, x) in row"
          :key="x"
          :block="block"
          @click="play.onClick(block)"
          @dblclick="play.autoExpand(block)"
          @contextmenu.prevent="play.onRightClick(block)"
        >
        </MineBlock>
      </div>
    </div>
  </div>

  <div flex justify-center v-if="play.state.value.status != 'play'">
    <div font-mono text-2xl flex="~ gap-1" items-center>
      {{ play.state.value.status == 'won' ? '胜利':'失败'}}
    </div>
  </div>

  <!-- <div flex="~ gap-1" justify-center>
    <button btn @click="toggleDev()">
      {{ isDev ? "作弊模式" : "正常模式" }}
    </button>
  </div> -->

  <Confetti :passed="play.state.value.status === 'won'" />
</template>
