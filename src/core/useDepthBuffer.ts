import { useFrame, useThree } from '@solid-three/fiber'
import { createMemo } from 'solid-js'
import { DepthFormat, DepthTexture, UnsignedShortType } from 'three'
import { useFBO } from './useFBO'

function useDepthBuffer({ size = 256, frames = Infinity }: { size?: number; frames?: number } = {}) {
  const store = useThree()
  const w = () => size || store.size.width * store.viewport.dpr
  const h = () => size || store.size.height * store.viewport.dpr

  const depthConfig = createMemo(() => {
    const depthTexture = new DepthTexture(w(), h())
    depthTexture.format = DepthFormat
    depthTexture.type = UnsignedShortType
    return { depthTexture }
  })

  let count = 0
  const depthFBO = useFBO(w, h, depthConfig)
  useFrame((state) => {
    if (frames === Infinity || count < frames) {
      state.gl.setRenderTarget(depthFBO)
      state.gl.render(state.scene, state.camera)
      state.gl.setRenderTarget(null)
      count++
    }
  })
  return depthFBO.depthTexture
}

export { useDepthBuffer }
