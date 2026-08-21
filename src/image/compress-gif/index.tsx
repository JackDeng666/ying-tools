import { render } from 'ink'
import { App } from './app'

export async function compressGif(saveDir: string) {
  render(<App saveDir={saveDir} />)
}
