import { useThree } from '@solid-three/fiber'
import { createRenderEffect } from 'solid-js'
import { Camera, CubeCamera, Object3D, Scene, WebGLCubeRenderTarget } from 'three'

type Props = {
  all?: boolean
  scene?: Object3D
  camera?: Camera
}

export function Preload(props: Props) {
  const store = useThree()

  // s3f:   should we remove `createRenderEffect`?
  // Layout effect because it must run before React commits
  createRenderEffect(() => {
    const invisible: Object3D[] = []
    if (props.all) {
      // Find all invisible objects, store and then flip them
      ;(props.scene || store.scene).traverse((object) => {
        if (object.visible === false) {
          invisible.push(object)
          object.visible = true
        }
      })
    }
    // Now compile the scene
    store.gl.compile(props.scene || store.scene, props.camera || store.camera)
    // And for good measure, hit it with a cube camera
    const cubeRenderTarget = new WebGLCubeRenderTarget(128)
    const cubeCamera = new CubeCamera(0.01, 100000, cubeRenderTarget)
    cubeCamera.update(store.gl, (props.scene || store.scene) as Scene)
    cubeRenderTarget.dispose()
    // Flips these objects back
    invisible.forEach((object) => (object.visible = false))
  })
  return null
}
