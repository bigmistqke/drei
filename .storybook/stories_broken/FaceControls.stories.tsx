/* eslint react-hooks/exhaustive-deps: 1 */

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Suspense } from 'solid-js'
import { Box, FaceControls, FaceLandmarker } from '../../src'

export default {
  title: 'Controls/FaceControls',
  component: FaceControls,
  decorators: [(storyFn) => <Setup cameraFov={60}>{storyFn()}</Setup>],
}

function FaceControlsScene(props) {
  return (
    <>
      <T.Color attach="background" args={['#303030']} />
      <T.AxesHelper />

      <Suspense fallback={null}>
        <FaceLandmarker>
          <FaceControls {...props} />
        </FaceLandmarker>
      </Suspense>

      <Box args={[0.1, 0.1, 0.1]}>
        <T.MeshStandardMaterial />
      </Box>
    </>
  )
}

export const FaceControlsSt = (args) => <FaceControlsScene {...args} />
FaceControlsSt.args = {
  eyes: undefined,
}

FaceControlsSt.argTypes = {
  eyes: { control: { type: 'boolean' } },
}

FaceControlsSt.storyName = 'Default'
