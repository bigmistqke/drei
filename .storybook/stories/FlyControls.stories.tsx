import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Box, FlyControls } from '../../src'

export const FlyControlsStory = ({ ...args }) => (
  <>
    <FlyControls {...args} />
    <Box>
      <T.MeshBasicMaterial wireframe />
    </Box>
  </>
)

FlyControlsStory.args = {
  autoForward: false,
  dragToLook: false,
  movementSpeed: 1.0,
  rollSpeed: 0.005,
}

FlyControlsStory.storyName = 'Default'

export default {
  title: 'Controls/FlyControls',
  component: FlyControls,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}
