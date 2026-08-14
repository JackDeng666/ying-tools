import { defineConfig } from 'rollup'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'

export default defineConfig({
  input: 'src/index.ts',
  external: ['commander', 'sharp', 'axios', 'inquirer', '@inquirer/prompts', 'chalk', 'compressing', 'ora'],
  output: {
    file: 'dist/index.js',
    format: 'es',
  },
  plugins: [typescript(), terser()],
})
