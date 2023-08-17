import { T, useFrame } from '@solid-three/fiber'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { Show, createSignal } from 'solid-js'
import { Box, CubeCamera } from '../../src'

export default {
  title: 'Camera/CubeCamera',
  component: CubeCamera,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 10, 40)}>{storyFn()}</Setup>],
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      axisHelper: object
    }
  }
}

function Sphere({ offset = 0, ...props }) {
  let ref: THREE.Mesh
  useFrame(({ clock }) => {
    ref!.position.y = Math.sin(offset + clock.elapsedTime) * 5 + 10
  })

  return (
    <CubeCamera {...props}>
      {(texture) => (
        <T.Mesh ref={ref!}>
          <T.SphereGeometry args={[5, 64, 64]} />
          <T.MeshStandardMaterial color="white" roughness={0} metalness={1} envMap={texture} />
        </T.Mesh>
      )}
    </CubeCamera>
  )
}

function Scene() {
  const [show, setShow] = createSignal(true)
  return (
    <>
      <T.Fog attach="fog" args={['#f0f0f0', 100, 200]} />
      <Box material-color="hotpink" args={[5, 5, 5]} position-y={2.5} onClick={() => setShow((v) => !v)} />

      <Sphere position={[-10, 10, 5]} />
      <Show when={show()}>
        <Sphere position={[10, 9, 0]} offset={2000} />
      </Show>

      <T.GridHelper args={[100, 10]} />
    </>
  )
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'
