import { Canvas, T } from '@solid-three/fiber'
import { For } from 'solid-js'

import { Icosahedron, OrthographicCamera } from '../../src'

export default {
  title: 'Camera/OrthographicCamera',
  component: OrthographicCameraScene,
}

const NUM = 3

interface Positions {
  id: string
  position: [number, number, number]
}

function OrthographicCameraScene() {
  const positions = (() => {
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
  })()

  return (
    <Canvas style={{ height: '100vh' }}>
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={40} />
      <T.Group position={[0, 0, -10]}>
        <For each={positions}>
          {({ id, position }) => (
            <Icosahedron key={id} position={position} args={[1, 1]}>
              <T.MeshBasicMaterial color="white" wireframe />
            </Icosahedron>
          )}
        </For>
      </T.Group>
      {/* <OrbitControls /> */}
    </Canvas>
  )
}

export const OrthographicCameraSceneSt = () => <OrthographicCameraScene />
OrthographicCameraSceneSt.story = {
  name: 'Default',
}
