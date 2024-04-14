import { defineConfig } from 'rollup'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'

export default defineConfig({
  input: 'src/index.ts',
  external: ['commander', 'axios', 'inquirer', 'chalk', 'compressing', 'ora', 'child_process', 'fs', 'path', 'url'],
  output: {
    file: 'dist/index.js',
    format: 'es',
  },
  plugins: [typescript(), terser()],
})
