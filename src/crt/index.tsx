import { render } from 'ink'
import { App } from './app'

export function crt(saveDir: string) {
  render(<App saveDir={saveDir} />)
}
