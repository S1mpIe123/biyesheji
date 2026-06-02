<template>
  <div class="nature-dynamic-bg" :class="'theme-' + theme">
    <canvas ref="canvasRef"></canvas>
    <div class="mist-layer mist-one"></div>
    <div class="mist-layer mist-two"></div>
    <div class="leaf-orbit orbit-one"></div>
    <div class="leaf-orbit orbit-two"></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  theme: {
    type: String,
    default: 'main'
  }
})

const canvasRef = ref(null)
let ctx = null
let width = 0
let height = 0
let dpr = 1
let frameId = 0
let particles = []
let leafVeins = []
let seed = 20260502

// 固定种子随机数：同一个种子生成稳定的自然纹理，符合生成艺术可复现的要求。
const seededRandom = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

const resetSeed = () => {
  seed = props.theme === 'auth' ? 20260521 : 20260502
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = canvas.clientWidth
  height = canvas.clientHeight
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  initSystem()
}

const initSystem = () => {
  resetSeed()
  const particleCount = Math.max(70, Math.floor((width * height) / 21000))
  particles = Array.from({ length: particleCount }, () => ({
    x: seededRandom() * width,
    y: seededRandom() * height,
    speed: 0.18 + seededRandom() * 0.54,
    radius: 0.9 + seededRandom() * 1.8,
    phase: seededRandom() * Math.PI * 2,
    alpha: 0.16 + seededRandom() * 0.24
  }))

  // 叶脉线负责让背景出现“农业、自然、生长”的隐含结构，而不是普通绿色渐变。
  const veinCount = props.theme === 'auth' ? 9 : 14
  leafVeins = Array.from({ length: veinCount }, (_, index) => {
    const baseY = height * (0.16 + seededRandom() * 0.72)
    return {
      x: width * (-0.08 + seededRandom() * 1.16),
      y: baseY,
      length: width * (0.18 + seededRandom() * 0.18),
      curve: 18 + seededRandom() * 54,
      angle: -0.28 + seededRandom() * 0.56,
      alpha: 0.08 + seededRandom() * 0.12,
      drift: 0.2 + seededRandom() * 0.42,
      offset: index * 31
    }
  })
}

// 轻量噪声场：由三角函数叠加构成稳定流动方向，驱动粒子像晨雾和花粉一样缓慢移动。
const flowAngle = (x, y, time) => {
  const nx = x / Math.max(width, 1)
  const ny = y / Math.max(height, 1)
  return Math.sin(nx * 7.1 + time * 0.00032) +
      Math.cos(ny * 6.4 - time * 0.00026) +
      Math.sin((nx + ny) * 5.3 + time * 0.00018)
}

const drawBackground = () => {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  if (props.theme === 'auth') {
    gradient.addColorStop(0, '#eaf7e7')
    gradient.addColorStop(0.48, '#8bdc62')
    gradient.addColorStop(1, '#156d2a')
  } else {
    gradient.addColorStop(0, '#dff1db')
    gradient.addColorStop(0.42, '#8bcf69')
    gradient.addColorStop(1, '#123b21')
  }
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const light = ctx.createRadialGradient(width * 0.22, height * 0.1, 0, width * 0.22, height * 0.1, width * 0.72)
  light.addColorStop(0, 'rgba(255,255,235,.42)')
  light.addColorStop(1, 'rgba(255,255,235,0)')
  ctx.fillStyle = light
  ctx.fillRect(0, 0, width, height)
}

const drawLeafVeins = (time) => {
  ctx.save()
  ctx.lineCap = 'round'
  leafVeins.forEach(item => {
    const driftX = Math.sin(time * 0.00018 + item.offset) * 18
    const driftY = Math.cos(time * 0.00015 + item.offset) * 10
    ctx.translate(item.x + driftX, item.y + driftY)
    ctx.rotate(item.angle)
    ctx.strokeStyle = `rgba(236, 255, 226, ${item.alpha})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-item.length * 0.5, 0)
    ctx.quadraticCurveTo(0, -item.curve, item.length * 0.5, 0)
    ctx.stroke()

    for (let i = -3; i <= 3; i++) {
      if (i === 0) {
        continue
      }
      const px = (item.length / 8) * i
      ctx.beginPath()
      ctx.moveTo(px, -Math.abs(i) * 1.6)
      ctx.lineTo(px + item.length * 0.08 * Math.sign(i), -item.curve * 0.24)
      ctx.stroke()
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  })
  ctx.restore()
}

const drawParticles = (time) => {
  particles.forEach(item => {
    const angle = flowAngle(item.x, item.y, time) + item.phase
    item.x += Math.cos(angle) * item.speed
    item.y += Math.sin(angle) * item.speed * 0.62 - 0.05

    if (item.x < -20) item.x = width + 20
    if (item.x > width + 20) item.x = -20
    if (item.y < -20) item.y = height + 20
    if (item.y > height + 20) item.y = -20

    const glow = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.radius * 7)
    glow.addColorStop(0, `rgba(245, 255, 214, ${item.alpha})`)
    glow.addColorStop(1, 'rgba(245, 255, 214, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(item.x, item.y, item.radius * 7, 0, Math.PI * 2)
    ctx.fill()
  })
}

const draw = (time = 0) => {
  if (!ctx) {
    return
  }
  drawBackground()
  drawLeafVeins(time)
  drawParticles(time)
  frameId = requestAnimationFrame(draw)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  frameId = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
  cancelAnimationFrame(frameId)
})
</script>

<style scoped>
.nature-dynamic-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  background: #1e4f27;
}

.nature-dynamic-bg canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.mist-layer {
  position: absolute;
  inset: auto -10% 0 -10%;
  height: 48%;
  filter: blur(18px);
  opacity: .42;
  transform: translate3d(0, 0, 0);
}

.mist-one {
  background: radial-gradient(ellipse at 24% 100%, rgba(255,255,255,.68), transparent 58%);
  animation: mistDrift 18s ease-in-out infinite alternate;
}

.mist-two {
  background: radial-gradient(ellipse at 76% 92%, rgba(203,255,180,.54), transparent 62%);
  animation: mistDrift 23s ease-in-out infinite alternate-reverse;
}

.leaf-orbit {
  position: absolute;
  border-radius: 42%;
  border: 1px solid rgba(235, 255, 221, .18);
  transform: rotate(35deg);
  animation: orbitPulse 16s ease-in-out infinite alternate;
}

.orbit-one {
  width: 420px;
  height: 420px;
  right: 8%;
  top: 8%;
}

.orbit-two {
  width: 560px;
  height: 560px;
  left: 4%;
  bottom: -18%;
  animation-delay: -6s;
}

.theme-auth {
  opacity: .95;
}

.theme-main {
  opacity: .9;
}

@keyframes mistDrift {
  from {
    transform: translateX(-2%) translateY(0);
  }
  to {
    transform: translateX(3%) translateY(-4%);
  }
}

@keyframes orbitPulse {
  from {
    opacity: .18;
    transform: rotate(28deg) scale(.96);
  }
  to {
    opacity: .36;
    transform: rotate(42deg) scale(1.04);
  }
}
</style>
