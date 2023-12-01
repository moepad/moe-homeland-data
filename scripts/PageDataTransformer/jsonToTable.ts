import type { PageListData } from '../types/PageList'
import { readdirSync, mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DATA_DIR = resolve(__dirname, '../../public/data/')
const OUT_DIR = resolve(__dirname, '.output-json2table')

try {
  mkdirSync(OUT_DIR)
} catch (_) {}

const topics = readdirSync(DATA_DIR)
  .filter((i) => i.endsWith('.json'))
  .map((i) => i.replace(/\.json$/, ''))

function transform(data: PageListData) {
  const rows: string[][] = []

  for (const { pages, label } of data.index) {
    pages.forEach((i) => {
      rows.push([
        label,
        i.title,
        i.displayTitle || '',
        i.imageSrc || '',
        i.description || '',
      ])
    })
  }

  return rows.map((i) => i.join('	').replace(/\n/g, '')).join('\n')
}

Promise.all(
  topics.map((item) => {
    const inputFile = resolve(DATA_DIR, `${item}.json`)
    const outputFile = resolve(OUT_DIR, `./${item}.txt`)

    return readFile(inputFile)
      .then((buffer) => buffer.toString())
      .then((data) => {
        const text = transform(JSON.parse(data))
        return writeFile(outputFile, text)
      })
      .then(() => outputFile)
  })
).then((res) => console.info('DONE', res))
