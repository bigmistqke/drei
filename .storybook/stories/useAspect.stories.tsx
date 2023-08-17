import { T, useLoader } from '@solid-three/fiber'
import { TextureLoader, Vector3 } from 'three'

import { Setup } from '../Setup'

import { Plane, useAspect } from '../../src'

export default {
  title: 'Misc/useAspect',
  component: useAspect,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, -10, 0)}>{storyFn()}</Setup>],
}

function Simple() {
  const scale = useAspect(1920, 1080, 1)

  return (
    <Plane scale={scale()} rotation-x={Math.PI / 2} args={[1, 1, 4, 4]}>
      <T.MeshPhongMaterial wireframe />
    </Plane>
  )
}

export const DefaultStory = () => (
  <T.Suspense fallback="">
    <Simple />
  </T.Suspense>
)
DefaultStory.storyName = 'Default'

function WithTexture() {
  const scale = useAspect(/* 'cover',  */ 1920, 1080, 1)

  const map = useLoader(TextureLoader, `https://source.unsplash.com/random/1920x1080`)

  return (
    <Plane scale={scale()} rotation-x={Math.PI / 2}>
      <T.MeshPhongMaterial map={map()} color="grey" />
    </Plane>
  )
}

export const TextureStory = () => (
  <T.Suspense fallback="">
    <WithTexture />
  </T.Suspense>
)
TextureStory.storyName = 'With Texture'
