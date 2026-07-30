<script setup lang="ts">
import { init, use, type EChartsType } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = withDefaults(defineProps<{ labels: string[], values: number[], color?: string, suffix?: string, compact?: boolean }>(), { color: '#1e9b68', suffix: '', compact: false })
const root = ref<HTMLElement>()
let chart: EChartsType | undefined
const resize = () => chart?.resize()

function render() {
  if (!root.value) return
  chart ||= init(root.value)
  chart.setOption({
    animationDuration: 500,
    grid: { left: 8, right: 8, top: 12, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis', valueFormatter: (value: unknown) => `${value}${props.suffix}`, borderWidth: 0, backgroundColor: '#15231e', textStyle: { color: '#fff' } },
    xAxis: { type: 'category', data: props.labels, boundaryGap: false, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: !props.compact, color: '#86908b', fontSize: 11 } },
    yAxis: { type: 'value', scale: true, splitNumber: 2, axisLabel: { show: false }, splitLine: { lineStyle: { color: '#edf0ee' } } },
    series: [{ type: 'line', data: props.values, smooth: 0.35, showSymbol: props.values.length < 8, symbolSize: 7, lineStyle: { color: props.color, width: 3 }, itemStyle: { color: props.color }, areaStyle: { color: `${props.color}18` } }]
  })
}
onMounted(() => { render(); window.addEventListener('resize', resize) })
watch(() => [props.labels, props.values], render, { deep: true })
onBeforeUnmount(() => { window.removeEventListener('resize', resize); chart?.dispose() })
</script>

<template><div ref="root" class="trend-chart" role="img" aria-label="趋势图"></div></template>
