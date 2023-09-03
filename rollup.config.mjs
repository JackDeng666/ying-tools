import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'lib/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
  },
  plugins: [commonjs(), terser()],
};
