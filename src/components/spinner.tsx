import { useAnimation, Text } from 'ink'

const characters = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
export function Spinner() {
  const { frame } = useAnimation({ interval: 80 })
  return <Text color="green">{characters[frame % characters.length]}</Text>
}
