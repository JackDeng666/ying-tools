import { HttpRequest } from '@ying-base/http'

export const http = new HttpRequest({
  logError: false,
})

export function formatBytes(bytes: number, decimal = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  // Math.pow(k, i) 是当前单位对应的字节数
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(decimal)}${sizes[i]}`
}

export type OnProgressProps = {
  done: boolean
  loaded: number
  total?: number
  progress?: number
}
export async function downloadWithProgress(url: string, onProgress?: (data: OnProgressProps) => void) {
  const response = await http.get(url, { responseType: 'raw' })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  if (!response.body) throw new Error(`Response body is not exists`)
  // 获取文件总大小
  const contentLength = response.headers.get('Content-Length')
  const total = contentLength ? parseInt(contentLength, 10) : undefined
  // 读取数据
  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let loaded = 0
  // 循环读取数据块
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      onProgress?.({ done, loaded })
      break
    }
    chunks.push(value)
    loaded += value.length
    if (total) {
      onProgress?.({ done, loaded, total, progress: loaded / total })
    } else {
      onProgress?.({ done, loaded })
    }
  }
  return Buffer.concat(chunks)
}
