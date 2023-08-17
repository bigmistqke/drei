import { Vector3 } from 'three'
import { Box, Html, OrbitControls, ScreenSpace } from '../../src'

import { T } from '@solid-three/fiber'
import { Setup } from '../Setup'

export default {
  title: 'Abstractions/ScreenSpace',
  component: ScreenSpace,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const ScreenSpaceStory = ({ depth }) => (
  <>
    <Box args={[1, 1, 1]}>
      <T.MeshPhysicalMaterial />
    </Box>
    <ScreenSpace depth={depth}>
      <Box args={[0.1, 0.1, 0.1]} position={[0.5, 0.1, 0]}>
        <T.MeshPhysicalMaterial color={'blue'} />
        <Html center sprite>
          <div style={{ color: 'hotpink' }}>Hi i'm in screen space</div>
        </Html>
      </Box>
    </ScreenSpace>

    <OrbitControls enablePan={true} zoomSpeed={0.5} />
  </>
)

ScreenSpaceStory.args = {
  depth: 1,
}
