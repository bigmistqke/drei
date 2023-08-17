import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Icosahedron, useTexture } from '../../src'

export default {
  title: 'Loaders/Texture',
  component: useTexture,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function TexturedMeshes() {
  // a convenience hook that uses useLoader and TextureLoader
  const resource = useTexture(['matcap-1.png', 'matcap-2.png'])

  // you can also use key: url objects:
  const props = useTexture({
    map: 'matcap-1.png',
    metalnessMap: 'matcap-2.png',
  })

  return (
    <>
      <Icosahedron position={[-2, 0, 0]}>
        <T.MeshMatcapMaterial matcap={resource()?.[0]} />
      </Icosahedron>
      <Icosahedron position={[2, 0, 0]}>
        <T.MeshMatcapMaterial matcap={resource()?.[1]} />
      </Icosahedron>
      <Icosahedron position={[6, 0, 0]}>
        <T.MeshStandardMaterial map={props()?.map} metalnessMap={props()?.metalnessMap} metalness={1} />
      </Icosahedron>
    </>
  )
}

function UseTextureScene() {
  return (
    <T.Suspense fallback={null}>
      <TexturedMeshes />
    </T.Suspense>
  )
}

export const UseTextureSceneSt = () => <UseTextureScene />
UseTextureSceneSt.story = {
  name: 'Default',
}
