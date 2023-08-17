import { Vector3 } from 'three'

import { T } from '@solid-three/fiber'
import { Box, Grid } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Gizmos/Grid',
  component: Grid,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(-5, 5, 10)}>{storyFn()}</Setup>],
}

function UseGridScene() {
  return (
    <T.Suspense fallback={null}>
      <Grid cellColor="white" args={[10, 10]} />
      <Box position={[0, 0.5, 0]}>
        <T.MeshStandardMaterial />
      </Box>
      <T.DirectionalLight position={[10, 10, 5]} />
    </T.Suspense>
  )
}

export const UseGridSceneSt = () => <UseGridScene />
UseGridSceneSt.story = {
  name: 'Default',
}
