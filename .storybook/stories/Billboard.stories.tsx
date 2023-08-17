import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Billboard, Box, Cone, OrbitControls, Plane, Text } from '../../src'

export default {
  title: 'Abstractions/Billboard',
  component: Billboard,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const BillboardStory = ({ follow, lockX, lockY, lockZ }) => (
  <>
    <Billboard follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ} position={[-4, -2, 0]}>
      <Plane args={[3, 2]} material-color="red" />
    </Billboard>
    <Billboard follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ} position={[-4, 2, 0]}>
      <Plane args={[3, 2]} material-color="orange" />
    </Billboard>
    <Billboard follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ} position={[0, 0, 0]}>
      <Plane args={[3, 2]} material-color="green" />
    </Billboard>
    <Billboard follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ} position={[4, -2, 0]}>
      <Plane args={[3, 2]} material-color="blue" />
    </Billboard>
    <Billboard follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ} position={[4, 2, 0]}>
      <Plane args={[3, 2]} material-color="yellow" />
    </Billboard>

    <OrbitControls enablePan={true} zoomSpeed={0.5} />
  </>
)

BillboardStory.args = {
  follow: true,
  lockX: false,
  lockY: false,
  lockZ: false,
}

BillboardStory.storyName = 'Planes'

export const BillboardTextStory = ({ follow, lockX, lockY, lockZ }) => (
  <>
    <Billboard follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ} position={[0.5, 2.05, 0.5]}>
      <Text fontSize={1} outlineWidth={'5%'} outlineColor="#000000" outlineOpacity={1}>
        box
      </Text>
    </Billboard>
    <Box position={[0.5, 1, 0.5]}>
      <T.MeshStandardMaterial color="red" />
    </Box>
    <T.Group position={[-2.5, -3, -1]}>
      <Billboard follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ} position={[0, 1.05, 0]}>
        <Text fontSize={1} outlineWidth={'5%'} outlineColor="#000000" outlineOpacity={1}>
          cone
        </Text>
      </Billboard>
      <Cone>
        <T.MeshStandardMaterial color="green" />
      </Cone>
    </T.Group>

    <Billboard follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ} position={[0, 0, -5]}>
      <Plane args={[2, 2]}>
        <T.MeshStandardMaterial color="#000066" />
      </Plane>
    </Billboard>

    <OrbitControls enablePan={true} zoomSpeed={0.5} />
  </>
)

BillboardTextStory.args = {
  follow: true,
  lockX: false,
  lockY: false,
  lockZ: false,
}

BillboardTextStory.storyName = 'Text'
