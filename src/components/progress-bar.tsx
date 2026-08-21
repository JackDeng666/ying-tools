import { Text, TextProps, useWindowSize } from 'ink'
import { insertIntoCenterVisual } from './utils'

type ProgressBarProps = {
  percent?: number
  left?: number
  right?: number
  character?: string
  text?: string
} & TextProps

export function ProgressBar({
  percent = 1,
  left = 0,
  right = 0,
  character = '█',
  text,
  ...textProps
}: ProgressBarProps) {
  const { columns } = useWindowSize()
  const space = columns - right - left
  const progressLength = Math.min(Math.floor(space * percent), space)
  const restLength = space - progressLength
  const progressText =
    ' '.repeat(left) +
    character.repeat(progressLength) +
    ' '.repeat(right) +
    (restLength > 0 ? ' '.repeat(restLength) : '')

  const finalText = text ? insertIntoCenterVisual(progressText, text) : progressText

  return <Text {...textProps}>{finalText}</Text>
}
