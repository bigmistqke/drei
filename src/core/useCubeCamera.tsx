import { useThree } from '@solid-three/fiber'
import { createMemo, onCleanup } from 'solid-js'
import * as THREE from 'three'
import { Fog, FogExp2, HalfFloatType, WebGLCubeRenderTarget } from 'three'
import { defaultProps } from '../helpers/defaultProps'
import { when } from '../helpers/when'

export type CubeCameraOptions = {
  /** Resolution of the FBO, 256 */
  resolution?: number
  /** Camera near, 0.1 */
  near?: number
  /** Camera far, 1000 */
  far?: number
  /** Custom environment map that is temporarily set as the scenes background */
  envMap?: THREE.Texture
  /** Custom fog that is temporarily set as the scenes fog */
  fog?: Fog | FogExp2
}

export function useCubeCamera(_props: CubeCameraOptions = {}) {
  const props = defaultProps(_props, {
    resolution: 256,
    near: 0.1,
    far: 1000,
  })

  const store = useThree()

  const fbo = createMemo(() => {
    const fbo = new WebGLCubeRenderTarget(props.resolution)
    fbo.texture.type = HalfFloatType
    onCleanup(() => fbo.dispose())
    return fbo
  })

  const camera = createMemo(() => when(fbo)((fbo) => new THREE.CubeCamera(props.near, props.far, fbo)))

  let originalFog
  let originalBackground
  const update = () =>
    when(camera)((camera) => {
      originalFog = store.scene.fog
      originalBackground = store.scene.background
      store.scene.background = props.envMap || originalBackground
      store.scene.fog = props.fog || originalFog
      camera.update(store.gl, store.scene)
      store.scene.fog = originalFog
      store.scene.background = originalBackground
    })

  return {
    fbo,
    camera,
    update,
  }
}
