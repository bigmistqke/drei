import { number, withKnobs } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { useGLTF, useMatcapTexture } from '../../src'

export default {
  title: 'Staging/useMatcapTexture',
  component: useMatcapTexture,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(0, 0, 3)}>{storyFn()}</Setup>],
}

function Suzanne() {
  const gltf = useGLTF('suzanne.glb', true)
  const [resource] = useMatcapTexture(number('texture index', 111), 1024)
  return (
    <T.Mesh geometry={(gltf()?.nodes.Suzanne as Mesh)?.geometry}>
      <T.MeshMatcapMaterial matcap={resource()} />
    </T.Mesh>
  )
}

function UseMatcapTexture() {
  return (
    <T.Suspense fallback={null}>
      <Suzanne />
    </T.Suspense>
  )
}

export const UseMatcapTextureSt = () => <UseMatcapTexture />
UseMatcapTextureSt.story = {
  name: 'Default',
}
