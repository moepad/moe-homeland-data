import { BANGUMI_SEASON_TITLE, BANGUMI_SEASON_URL } from '../utils/constants'
import { mkdirSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { TableToJson } from './Transformer'

try {
  mkdirSync(resolve(__dirname, '.output-table2json'))
} catch (_) {}

const API_ENDPOINT = 'https://zh.moegirl.org.cn/api.php'
const INPUT_DIR = resolve(__dirname, '.input-table2json')
const OUTPUT_DIR = resolve(__dirname, '.output-table2json')

Promise.all(
  readdirSync(INPUT_DIR)
    .filter((i) => !i.startsWith('_') && i.endsWith('.txt'))
    .map((i) => i.replace(/\.txt$/, ''))
    .map(async (file) => {
      const input = resolve(INPUT_DIR, `${file}.txt`)
      const output = resolve(OUTPUT_DIR, `${file}.json`)

      return TableToJson.newFromFile(input, {
        apiEndpoint: API_ENDPOINT,
        thumbWidth: 300,
        indexLabelMap: {
          周一: 'monday',
          周二: 'tuesday',
          周三: 'wednesday',
          周四: 'thursday',
          周五: 'friday',
          周六: 'saturday',
          周日: 'sunday',
        },
        meta: file.includes('weekly-bangumi')
          ? {
              header: '本周新番',
              readMoreText: BANGUMI_SEASON_TITLE,
              readMoreUrl: BANGUMI_SEASON_URL,
            }
          : undefined,
      }).then(async (app) => {
        await app.transform()
        await app.export(output)
        return output
      })
    })
).then((outFiles) => console.info('DONE', outFiles))
