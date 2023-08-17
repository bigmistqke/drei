import { Portal, T, useFrame, useThree } from '@solid-three/fiber'
import { For, createMemo, createSignal } from 'solid-js'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { OrthographicCamera, useCamera } from '../../src'

export default {
  title: 'Misc/useCamera',
  component: UseCameraScene,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

// s3f:   event-system with Portal is currently broken
function UseCameraScene() {
  let virtualCam: THREE.Camera
  let ref: THREE.Mesh

  const [hover, setHover] = createSignal<null | number>(null)

  const store = useThree()

  const virtualScene = createMemo(() => new THREE.Scene(), [])

  const matrix = new THREE.Matrix4()

  useFrame(() => {
    matrix.copy(store.camera.matrix).invert()

    if (ref) {
      ref.quaternion.setFromRotationMatrix(matrix)
    }

    store.gl.autoClear = true
    store.gl.render(store.scene, store.camera)

    store.gl.autoClear = false
    store.gl.clearDepth()
    store.gl.render(virtualScene(), virtualCam)
  }, 1)

  const handlePointerOut = () => setHover(null)
  const handlePointerMove = (e: THREE.Event) => {
    setHover(Math.floor(e.faceIndex ?? 0 / 2))
  }
  return (
    <>
      <Portal container={virtualScene()}>
        <OrthographicCamera ref={virtualCam!} makeDefault={false} position={[0, 0, 100]} zoom={2} />

        <T.Mesh
          ref={ref!}
          raycast={useCamera(virtualCam!)}
          onPointerOut={handlePointerOut}
          onPointerMove={handlePointerMove}
        >
          <For each={[...Array(6)]}>
            {(_, index) => <T.MeshLambertMaterial color="hotpink" wireframe={hover() !== index()} />}
          </For>
          <T.BoxGeometry args={[60, 60, 60]} />
        </T.Mesh>

        <T.AmbientLight intensity={0.5} />
        <T.PointLight position={[10, 10, 10]} intensity={0.5} />
      </Portal>
    </>
  )
}

export const UseCameraSt = () => <UseCameraScene />

UseCameraSt.story = {
  name: 'Default',
}
