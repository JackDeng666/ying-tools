import { render } from 'ink'
import { App } from './app'

export async function compressNormal(saveDir: string) {
  render(<App saveDir={saveDir} />)
}
