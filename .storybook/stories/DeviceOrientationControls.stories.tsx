import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Box, DeviceOrientationControls } from '../../src'

export function DeviceOrientationControlsStory() {
  // s3f:   something going wrong with the args-prop: should be a | and not &
  return (
    <>
      <DeviceOrientationControls />
      <Box args={[100, 100, 100, 4, 4, 4]}>
        <T.MeshBasicMaterial wireframe />
        <T.AxesHelper args={[100]} />
      </Box>
    </>
  )
}

DeviceOrientationControlsStory.storyName = 'Default'

export default {
  title: 'Controls/DeviceOrientationControls',
  component: DeviceOrientationControls,
  decorators: [
    (storyFn) => (
      <Setup camera={{ near: 1, far: 1100, fov: 75 }} controls={false}>
        {storyFn()}
      </Setup>
    ),
  ],
}
