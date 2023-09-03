import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'lib/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
  },
  plugins: [commonjs(), json(), terser()],
};
