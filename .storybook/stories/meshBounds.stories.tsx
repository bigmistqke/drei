import { createSignal } from 'solid-js'
import { Vector3 } from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { T } from '@solid-three/fiber'
import { meshBounds } from '../../src'

export default {
  title: 'Misc/meshBounds',
  component: MeshBounds,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}
function MeshBounds(props) {
  const turntable = useTurntable()

  const [hovered, setHover] = createSignal(false)

  return (
    <T.Mesh
      {...props}
      raycast={meshBounds}
      ref={turntable}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <T.BoxGeometry args={[1, 1, 1]} />
      <T.MeshStandardMaterial color="hotpink" wireframe={!hovered()} />
    </T.Mesh>
  )
}

export const MeshBoundsSt = () => (
  <>
    <MeshBounds position={[0, 1, 0]} />
    <MeshBounds position={[1, -1, 0]} />
    <MeshBounds position={[-1, -1, 0]} />
  </>
)

MeshBoundsSt.story = {
  name: 'Default',
}
