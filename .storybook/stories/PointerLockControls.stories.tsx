import { For, createMemo } from 'solid-js'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Icosahedron, PointerLockControls } from '../../src'

export default {
  title: 'Controls/PointerLockControls',
  component: PointerLockControlsScene,
}

const NUM = 2

interface Positions {
  id: string
  position: [number, number, number]
}

function Icosahedrons() {
  const positions = createMemo(() => {
    const pos: Positions[] = []
    const half = (NUM - 1) / 2

    for (let x = 0; x < NUM; x++) {
      for (let y = 0; y < NUM; y++) {
        for (let z = 0; z < NUM; z++) {
          pos.push({
            id: `${x}-${y}-${z}`,
            position: [(x - half) * 4, (y - half) * 4, (z - half) * 4],
          })
        }
      }
    }

    return pos
  }, [])

  return (
    <T.Group>
      <For each={positions()}>
        {({ id, position }) => (
          <Icosahedron key={id} args={[1, 1]} position={position}>
            <T.MeshBasicMaterial color="white" wireframe />
          </Icosahedron>
        )}
      </For>
    </T.Group>
  )
}

function PointerLockControlsScene() {
  return (
    <>
      <Setup camera={{ position: [0, 0, 10] }}>
        <Icosahedrons />
        <PointerLockControls />
      </Setup>
    </>
  )
}

export const PointerLockControlsSceneSt = () => <PointerLockControlsScene />
PointerLockControlsSceneSt.story = {
  name: 'Default',
}

function PointerLockControlsSceneWithSelector() {
  return (
    <>
      <div
        id="instructions"
        style={{
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'center',
          height: '2em',
          background: 'white',
        }}
      >
        Click here to play
      </div>
      <Setup controls={false} camera={{ position: [0, 0, 10] }}>
        <Icosahedrons />
        <PointerLockControls selector="#instructions" onLock={() => console.log('onLock')} />
      </Setup>
      <div
        id="instructions"
        style={{
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'center',
          height: '2em',
          background: 'white',
        }}
      >
        Click here to play
      </div>
    </>
  )
}

export const PointerLockControlsSceneStWithSelector = () => <PointerLockControlsSceneWithSelector />
PointerLockControlsSceneStWithSelector.story = {
  name: 'With selector',
}
