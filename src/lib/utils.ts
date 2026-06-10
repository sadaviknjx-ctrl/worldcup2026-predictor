import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMatchDate(dateStr: string): string {
  return format(new Date(dateStr), 'MM月dd日 HH:mm', { locale: zhCN })
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: zhCN })
}

export function isMatchPast(dateStr: string): boolean {
  return isPast(new Date(dateStr))
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    group: '小组赛',
    round_of_32: '附加赛',
    round_of_16: '十六强',
    quarter_final: '八强',
    semi_final: '四强',
    third_place: '季军赛',
    final: '决赛',
  }
  return labels[stage] ?? stage
}

export function calcPredictionPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): number {
  // Exact score: 3 points; correct result: 1 point
  if (predictedHome === actualHome && predictedAway === actualAway) return 3
  const predictedResult = Math.sign(predictedHome - predictedAway)
  const actualResult = Math.sign(actualHome - actualAway)
  if (predictedResult === actualResult) return 1
  return 0
}
