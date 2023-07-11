<template>
  <button
    min-w-10
    min-h-10
    border="1 gray-400/30"
    flex="~"
    items-center
    justify-center
    m="0.5"
    :class="getBlockClass(block)"
  >
    <template v-if="block.flagged">
      <!-- <div i-carbon-flag c-yellow></div> -->
      <div c-yellow>🚩</div>
    </template>
    <template v-if="block.revealed || isDev">
      <!-- <div v-if="block.mine" c-red i-carbon-uv-index></div> -->
      <div v-if="block.mine" c-red >💣</div>
      <div v-else font-bold>{{ block.adjacentMines }}</div>
    </template>
  </button>
</template>

<script setup lang="ts">
import { BlockState } from "../types.js";
import { isDev } from "~/composables";

defineProps<{ block: BlockState }>();

//定义每个数值的颜色！
const numberColors = [
  "text-transparent",
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-orange-500",
  "text-red-500",
  "text-purple-500",
  "text-pink-500",
  "text-teal-500",
];
// 颜色
function getBlockClass(block: BlockState) {
  if (block.flagged) {
    return "bg-gray-500/10";
  }
  //还没翻开的时候就不给颜色
  if (!block.revealed) {
    return "bg-gray-500/10 hover:bg-gray-500/20";
  }
  return block.mine ? "bg-red-500/10" : numberColors[block.adjacentMines];
}
</script>
