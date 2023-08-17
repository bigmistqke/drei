import { number, withKnobs } from '@storybook/addon-knobs'
import { Mesh, Vector2, Vector3 } from 'three'

import { T } from '@solid-three/fiber'
import { useGLTF, useNormalTexture } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Staging/useNormalTexture',
  component: useNormalTexture,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(0, 0, 3)}>{storyFn()}</Setup>],
}

function Suzanne() {
  const gltf = useGLTF('suzanne.glb', true)
  const repeat = number('texture repeat', 8)
  const scale = number('texture scale', 4)
  const resource = useNormalTexture(number('texture index', 3), {
    repeat: [repeat, repeat],
    anisotropy: 8,
  })

  return (
    <T.Mesh geometry={(gltf()?.nodes.Suzanne as Mesh).geometry}>
      <T.MeshStandardMaterial
        color="darkmagenta"
        roughness={0.9}
        metalness={0.1}
        normalScale={new Vector2(scale, scale)}
        normalMap={resource()?.texture}
      />
    </T.Mesh>
  )
}

function UseNormalTexture() {
  return (
    <T.Suspense fallback={null}>
      <Suzanne />
    </T.Suspense>
  )
}

export const UseNormalTextureSt = () => <UseNormalTexture />
UseNormalTextureSt.story = {
  name: 'Default',
}
