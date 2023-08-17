import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Icosahedron, useCubeTexture } from '../../src'

export default {
  title: 'Loaders/CubeTexture',
  component: useCubeTexture,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function TexturedMeshes() {
  const envMap = useCubeTexture(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'], { path: 'cube/' })

  return (
    <Icosahedron args={[3, 4]}>
      <T.MeshStandardMaterial envMap={envMap()} roughness={0} metalness={0.9} color="#010101" />
    </Icosahedron>
  )
}

function UseCubeTextureScene() {
  return (
    <T.Suspense fallback={null}>
      <TexturedMeshes />
    </T.Suspense>
  )
}

export const UseCubeTextureSceneSt = () => <UseCubeTextureScene />
UseCubeTextureSceneSt.story = {
  name: 'Default',
}
