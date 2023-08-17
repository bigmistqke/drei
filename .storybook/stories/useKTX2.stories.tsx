import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Box, useKTX2 } from '../../src'

export default {
  title: 'Loaders/KTX2',
  component: useKTX2,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function TexturedMeshes() {
  // a convenience hook that uses useLoader and KTX2Loader
  const resource = useKTX2(['sample_uastc_zstd.ktx2', 'sample_etc1s.ktx2'])

  return (
    <>
      <Box position={[-2, 0, 0]}>
        <T.MeshBasicMaterial map={resource()?.[0]} />
      </Box>
      <Box position={[2, 0, 0]}>
        <T.MeshBasicMaterial map={resource()?.[1]} />
      </Box>
    </>
  )
}

function UseKTX2Scene() {
  return (
    <T.Suspense fallback={null}>
      <TexturedMeshes />
    </T.Suspense>
  )
}

export const UseKTX2SceneSt = () => <UseKTX2Scene />
UseKTX2SceneSt.story = {
  name: 'Default',
}
