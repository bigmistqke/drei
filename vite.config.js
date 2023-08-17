// vite.config.js
import { glslify } from 'vite-plugin-glslify'

console.log(glslify)

export default {
  plugins: [glslify()],
}
