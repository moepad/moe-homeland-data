import { getUrl } from './getUrl'

function getCurrentSeasonName(date: Date) {
  const month = date.getMonth() + 1 // 获取当前月份（0-11），需要加1转化为（1-12）

  if (month >= 1 && month <= 3) {
    return '冬季'
  } else if (month >= 4 && month <= 6) {
    return '春季'
  } else if (month >= 7 && month <= 9) {
    return '夏季'
  } else {
    return '秋季'
  }
}

export const BANGUMI_SEASON_TITLE = (() => {
  const date = new Date()
  const year = date.getFullYear()
  const monthName = getCurrentSeasonName(date)
  return `日本${year}年${monthName}动画`
})()

export const BANGUMI_SEASON_URL = getUrl(BANGUMI_SEASON_TITLE, {
  utm_medium: 'bangumi_list',
})
