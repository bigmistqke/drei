import { withKnobs } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Box, Resize, ResizeProps } from '../../src'

export default {
  title: 'Staging/Resize',
  component: Resize,
  decorators: [
    withKnobs,
    (storyFn) => (
      <Setup camera={{ position: [1, 1, 1], zoom: 150 }} orthographic>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const ResizeSt = (props: ResizeProps) => (
  <>
    <T.AxesHelper />
    <Resize width={props.width} height={props.height} depth={props.depth}>
      <Box args={[70, 40, 20]}>
        <T.MeshBasicMaterial wireframe />
      </Box>
    </Resize>
  </>
)

ResizeSt.args = {
  width: undefined,
  height: undefined,
  depth: undefined,
}

ResizeSt.argTypes = {
  width: { control: { type: 'boolean' } },
  height: { control: { type: 'boolean' } },
  depth: { control: { type: 'boolean' } },
}

ResizeSt.storyName = 'Default'
