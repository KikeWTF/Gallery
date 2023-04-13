<template>
  <div id="loading">
    <div class="loader">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="0" width="20" height="100" />
        <rect x="40" y="25" width="20" height="40" transform="rotate(45, 50, 50)" />
        <rect x="20" y="38" width="20" height="40" transform="rotate(-45, 70, 20)" />
      </svg>
      <p id="progress">0%</p>
    </div>
  </div>
</template>
<style scoped>
p {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2f3545;
  margin: 10px auto;
  text-align: center;
}
#loading {
  position: absolute;
  z-index: 10;
  top: 0;
  left: 0;
  display: flex;
  background-color: #f5f9ff;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  opacity: 1;
  transition: opacity 1s ease-in-out;
}
.loader {
  --path: #2f3545;
  --duration: 3s;
  width: 44px;
  height: 44px;
  position: relative;
  display: inline-block;
  margin: 0 16px;
}
.loader:before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  position: absolute;
  display: block;
  top: 37px;
  left: 19px;
  transform: translate(-18px, -18px);
  -webkit-animation: dotRect var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
  animation: dotRect var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
}
.loader svg {
  display: block;
  width: 100%;
  height: 100%;
}
.loader svg rect {
  fill: none;
  stroke: var(--path);
  stroke-width: 10px;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.loader svg rect {
  stroke-dasharray: 192 64 192 64;
  stroke-dashoffset: 0;
  -webkit-animation: pathRect 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
  animation: pathRect 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
}

@-webkit-keyframes pathRect {
  25% {
    stroke-dashoffset: 64;
  }
  50% {
    stroke-dashoffset: 128;
  }
  75% {
    stroke-dashoffset: 192;
  }
  100% {
    stroke-dashoffset: 256;
  }
}
@keyframes pathRect {
  25% {
    stroke-dashoffset: 64;
  }
  50% {
    stroke-dashoffset: 128;
  }
  75% {
    stroke-dashoffset: 192;
  }
  100% {
    stroke-dashoffset: 256;
  }
}
@-webkit-keyframes dotRect {
  25% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(18px, -18px);
  }
  75% {
    transform: translate(0, -36px);
  }
  100% {
    transform: translate(-18px, -18px);
  }
}
@keyframes dotRect {
  25% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(18px, -18px);
  }
  75% {
    transform: translate(0, -36px);
  }
  100% {
    transform: translate(-18px, -18px);
  }
}
*,
*:before,
*:after {
  box-sizing: border-box;
}
</style>
<script lang="ts">
import type { ILoadingScreen } from '@babylonjs/core'
import { defineComponent, type DefineComponent } from 'vue'

export type LoadingScreenType = DefineComponent<{
  dom: HTMLElement | null
  progress: HTMLElement | null
}>

export default defineComponent({
  data() {
    return {
      dom: null as HTMLElement | null,
      progress: null as HTMLElement | null
    }
  },
  mounted() {
    this.dom = document.getElementById('loading') as HTMLElement
    this.progress = document.getElementById('progress') as HTMLElement
  },
  expose: ['createLoadingScreen', 'updateProgress'],
  methods: {
    createLoadingScreen(): ILoadingScreen {
      return new CustomLoadingScreen(this.dom as HTMLElement)
    },

    updateProgress(percentage: number): void {
      if (this.progress) {
        if (percentage > 99) this.progress.innerText = ''
        else this.progress.innerText = `${percentage}%`
      }
    }
  }
})

class CustomLoadingScreen implements ILoadingScreen {
  loadingUIText: string = '0%'
  loadingUIBackgroundColor: string = '#f5f9ff'

  constructor(private dom: HTMLElement) {}

  displayLoadingUI(): void {
    if (this.dom) {
      this.dom.style.opacity = '1'
      this.dom.style.display = 'initial'
    }
  }

  hideLoadingUI(): void {
    const dom = this.dom
    if (dom) {
      dom.style.opacity = '0'
      setTimeout(() => (dom.style.display = 'none'), 1000)
    }
  }
}
</script>
