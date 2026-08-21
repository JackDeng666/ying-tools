export const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, '')

/**
 * 获取单个字符在终端中的显示宽度
 * 半角 = 1，全角（CJK、emoji、全角标点等）= 2
 */
export function getCharDisplayWidth(char: string): number {
  const cp = char.codePointAt(0) || 0

  // CJK 统一表意文字及扩展
  if (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x20000 && cp <= 0x2a6df) ||
    (cp >= 0x30000 && cp <= 0x323af) ||
    (cp >= 0xf900 && cp <= 0xfaff)
  )
    return 2

  // 全角区块：片假名、平假名、Hangul、全角符号等
  if (
    (cp >= 0xff00 && cp <= 0xffef) ||
    (cp >= 0x3000 && cp <= 0x303f) ||
    (cp >= 0x3040 && cp <= 0x309f) ||
    (cp >= 0x30a0 && cp <= 0x30ff) ||
    (cp >= 0xac00 && cp <= 0xd7af) ||
    (cp >= 0x2600 && cp <= 0x27bf) ||
    (cp >= 0x1f300 && cp <= 0x1f6ff) ||
    (cp >= 0x1f600 && cp <= 0x1f64f)
  )
    return 2

  // 控制字符
  if (cp < 0x20 || cp === 0x7f) return 0

  return 1
}

export function getStringWidth(str: string): number {
  return Array.from(str).reduce((sum, ch) => sum + getCharDisplayWidth(ch), 0)
}

export function truncateByWidth(str: string, maxWidth: number): string {
  let result = ''
  let w = 0
  for (const ch of str) {
    const cw = getCharDisplayWidth(ch)
    if (w + cw > maxWidth) break
    result += ch
    w += cw
  }
  return result
}

/**
 * 将 shortStr 视觉居中插入 longStr，保持终端显示总宽度不变
 *
 * 注意：若 longStr 全由全角字符组成，且 shortStr 视觉宽度为奇数，
 *       由于字符不可分割，结果宽度可能少 1。此时若 strict=true 会自动
 *       在末尾补一个半角空格强行对齐。
 */
export function insertIntoCenterVisual(longStr: string, shortStr: string, strict: boolean = false): string {
  const chars = Array.from(longStr)
  const widths = chars.map(getCharDisplayWidth)
  const longWidth = widths.reduce((a, b) => a + b, 0)
  const shortWidth = getStringWidth(stripAnsi(shortStr))

  if (shortWidth >= longWidth) {
    return truncateByWidth(shortStr, longWidth)
  }

  // ---------- 策略 1：精确匹配 ----------
  // 找一段宽度恰好 == shortWidth 的连续子串，选最居中的
  const matches: Array<{ start: number; end: number; dist: number }> = []

  for (let i = 0; i < chars.length; i++) {
    let w = 0
    for (let j = i; j < chars.length; j++) {
      w += widths[j]!
      if (w === shortWidth) {
        const visualStart = widths.slice(0, i).reduce((a, b) => a + b, 0)
        const center = visualStart + w / 2
        matches.push({ start: i, end: j, dist: Math.abs(center - longWidth / 2) })
        break
      }
      if (w > shortWidth) break
    }
  }

  if (matches.length) {
    matches.sort((a, b) => a.dist - b.dist)
    const m = matches[0]!
    return chars.slice(0, m.start).join('') + shortStr + chars.slice(m.end + 1).join('')
  }

  // ---------- 策略 2：贪心分割 + 微调 ----------
  const padTotal = longWidth - shortWidth
  const leftTarget = Math.floor(padTotal / 2)

  // 左侧保留
  let leftWidth = 0
  let leftIdx = 0
  while (leftIdx < chars.length) {
    const cw = widths[leftIdx]!
    if (leftWidth + cw > leftTarget) break
    leftWidth += cw
    leftIdx++
  }

  // 右侧保留
  let rightWidth = 0
  let rightIdx = chars.length - 1
  const rightTarget = padTotal - leftWidth
  while (rightIdx >= leftIdx) {
    const cw = widths[rightIdx]!
    if (rightWidth + cw > rightTarget) break
    rightWidth += cw
    rightIdx--
  }

  // 计算中段宽度
  let midWidth = 0
  for (let i = leftIdx; i <= rightIdx; i++) midWidth += widths[i]!

  // 微调：让中段宽度尽量逼近 shortWidth
  const diff = midWidth - shortWidth
  if (diff > 0) {
    // 中段太宽，尝试从右侧缩小
    let remain = diff
    while (remain > 0 && rightIdx >= leftIdx) {
      const cw = widths[rightIdx]!
      if (cw <= remain) {
        remain -= cw
        rightIdx--
      } else break
    }
    while (remain > 0 && leftIdx <= rightIdx) {
      const cw = widths[leftIdx]!
      if (cw <= remain) {
        remain -= cw
        leftIdx++
      } else break
    }
  } else if (diff < 0) {
    // 中段太窄，尝试向右侧借字符扩大
    let remain = -diff
    while (remain > 0 && rightIdx + 1 < chars.length) {
      const cw = widths[rightIdx + 1]!
      if (cw <= remain) {
        remain -= cw
        rightIdx++
      } else break
    }
    while (remain > 0 && leftIdx - 1 >= 0) {
      const cw = widths[leftIdx - 1]!
      if (cw <= remain) {
        remain -= cw
        leftIdx--
      } else break
    }
  }

  let result = chars.slice(0, leftIdx).join('') + shortStr + chars.slice(rightIdx + 1).join('')

  // strict 模式：若因字符不可分割导致宽度少 1，补空格对齐
  if (strict) {
    const resultWidth = getStringWidth(stripAnsi(result))
    if (resultWidth < longWidth) result += ' '.repeat(longWidth - resultWidth)
  }

  return result
}
