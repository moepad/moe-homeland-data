export interface PageListData {
  meta?: PageListMeta
  index: PageListIndex[]
}

export interface PageListMeta {
  header: string
  readMoreText?: string
  readMoreUrl?: string
}

export interface PageListIndex {
  id: string
  label: string
  pages: PageItemWithThumb[]
}

export interface PageListItem {
  id?: string
  title: string
  displayTitle?: string
  description?: string
  externalUrl?: string
  isAdvertisement?: boolean
}
export interface PageThumb {
  imageSrc: string
  imageAlt?: string
}
export type PageItemWithThumb = PageListItem & PageThumb

declare const PageListData: PageListData
declare const PageListMeta: PageListMeta
declare const PageListIndex: PageListIndex
declare const PageListItem: PageListItem
declare const PageThumb: PageThumb
declare const PageItemWithThumb: PageItemWithThumb
