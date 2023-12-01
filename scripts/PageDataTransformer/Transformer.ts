import { MwApi } from 'wiki-saikou'
import { readFile, writeFile } from 'node:fs/promises'
import { PageListData, PageListMeta } from '../types/PageList'

export interface TableToJsonOptions {
  apiEndpoint: string
  thumbWidth?: number
  indexLabelMap?: Record<string, any>
  meta?: PageListMeta
}

export class TableToJson {
  public api: MwApi
  private data: PageListData = {
    index: [],
  }

  constructor(readonly content = '', public options: TableToJsonOptions) {
    this.api = new MwApi(options.apiEndpoint)
  }

  static async newFromFile(fileName: string, options: TableToJsonOptions) {
    const text = (await readFile(fileName)).toString()
    return new TableToJson(text, options)
  }

  async transform() {
    this.content
      .split('\n')
      .map((i) => i.trim())
      .filter((i) => !!i)
      .forEach((i) => {
        let [label, title, displayTitle = '', imageSrc = '', description = ''] =
          i.split('	')

        title = TableToJson.adjustTitle(title)
        // imageSrc = imageSrc.includes('/thumb')
        //   ? imageSrc.replace(
        //       /https:\/\/img.moegirl.org.cn\/common\/thumb\/.{1,2}\/.{1,2}\/(.+)\/.+/,
        //       (_, $1) =>
        //         PageDataTransformer.makeThumbUrl(
        //           $1,
        //           this.options.thumbWidth || 300
        //         )
        //     )
        //   : PageDataTransformer.makeThumbUrl(
        //       imageSrc.split('/').pop(),
        //       this.options.thumbWidth || 300
        //     )

        if (!label || !title) return

        const index = this.getIndex(label)
        ;(index.pages = index.pages || []).push({
          title,
          displayTitle: displayTitle || undefined,
          description: description?.replace(/\n/g, '') || undefined,
          imageSrc,
        })
      })

    this.data = await TableToJson.fixMissingDataFromApi(this.data, this.api)
    this.data.meta = this.options.meta

    return this
  }

  getIndex(name = '') {
    const index = this.data.index.findIndex(({ label }) => label === name)
    if (index >= 0) {
      return this.data.index[index]
    }
    this.data.index.push({
      id:
        this.options?.indexLabelMap?.[name] ||
        Math.random().toString(36).substring(2, 8),
      label: name,
      pages: [],
    })
    return this.data.index[this.data.index.length - 1]
  }

  getData() {
    return this.data
  }
  async export(fileName: string) {
    return writeFile(fileName, JSON.stringify(this.data, null, 2))
  }

  /** Utils */
  static adjustTitle(title = '') {
    title = title
      .split('#')[0]
      .replace(/[\s_]+/g, ' ')
      .trim()
    if (title.includes('title=')) {
      title = new URLSearchParams(title).get('title') || title
    }
    return title
  }
  static makeThumbUrl(fileName = '', width = 400) {
    fileName = fileName.trim().replace(/\s+/g, '_')
    return fileName
      ? `https://commons.moegirl.org.cn/thumb.php?${new URLSearchParams({
          f: decodeURI(fileName),
          w: '' + width,
        })}`
      : ''
  }
  static async fixMissingDataFromApi(data: PageListData, api: MwApi) {
    for (const index of data.index) {
      const pages = index.pages
      const pagesMissingData = pages.filter(
        (i) => !i.description || !i.imageSrc
      )

      if (!pagesMissingData.length) {
        continue
      }

      console.info(
        'Fetch Missing Data',
        pagesMissingData.map((i) => i.title)
      )

      const loop = async (from = 0): Promise<boolean> => {
        const titles = pagesMissingData
          .map((i) => i.title)
          .slice(from, from + 50)
        const {
          data: {
            query: { pages: retPages },
          },
        } = await api.post({
          action: 'query',
          titles,
          prop: 'extracts|pageimages',
          exintro: 1,
          explaintext: 1,
          exsectionformat: 'plain',
          piprop: 'thumbnail|name',
          pithumbsize: '300',
        })

        retPages.forEach(({ extract, title, pageimage, thumbnail }: any) => {
          const p = pages.find((i) => i.title === title)
          if (!p) return
          !p.description && extract && (p.description = extract)
          if (!p.imageSrc && pageimage && thumbnail) {
            p.imageSrc = thumbnail.source
            p.imageAlt = pageimage
          }
        })

        return from + 50 < pages.length ? loop(from + 50) : true
      }
      await loop(0)
    }

    return data
  }
}
