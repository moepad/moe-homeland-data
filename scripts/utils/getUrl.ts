/**
 * 根据页面标题或文章ID，返回一个可带参数的页面链接
 */
export function getUrl(title: string, params?: Record<string, string>): string
export function getUrl(curid: number, params?: Record<string, string>): string
export function getUrl(
  titleOrId: string | number,
  params?: Record<string, string>
) {
  return `/index.php?${new URLSearchParams({
    ...params,
    ...(typeof titleOrId === 'string'
      ? { title: titleOrId }
      : { curid: '' + titleOrId }),
    utm_source: 'moe_homeland',
  })}`
}
