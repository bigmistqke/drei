import { Canvas, T } from '@solid-three/fiber'
import { For, createMemo } from 'solid-js'

import { Icosahedron, OrbitControls, PerspectiveCamera } from '../../src'

export default {
  title: 'Camera/PerspectiveCamera',
  component: PerspectiveCameraScene,
}

const NUM = 3

interface Positions {
  id: string
  position: [number, number, number]
}

function PerspectiveCameraScene() {
  const positions = createMemo(() => {
    const pos: Positions[] = []
    const half = (NUM - 1) / 2

    for (let x = 0; x < NUM; x++) {
      for (let y = 0; y < NUM; y++) {
        pos.push({
          id: `${x}-${y}`,
          position: [(x - half) * 4, (y - half) * 4, 0],
        })
      }
    }

    return pos
  }, [])

  return (
    <Canvas style={{ height: '100vh' }}>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <T.Group position={[0, 0, -10]}>
        <For each={positions()}>
          {({ id, position }) => (
            <Icosahedron key={id} position={position} args={[1, 1]}>
              <T.MeshBasicMaterial color="white" wireframe />
            </Icosahedron>
          )}
        </For>
      </T.Group>
      <OrbitControls />
    </Canvas>
  )
}

export const PerspectiveCameraSceneSt = () => <PerspectiveCameraScene />
PerspectiveCameraSceneSt.story = {
  name: 'Default',
}
