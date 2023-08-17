import { number, withKnobs } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { useTrailTexture } from '../../src'

export default {
  title: 'misc/useTrailTexture',
  component: useTrailTexture,
  decorators: [withKnobs, (storyFn) => <Setup>{storyFn()}</Setup>],
}

function TrailMesh() {
  // a convenience hook that uses useLoader and TextureLoader
  const resource = useTrailTexture({
    size: number('Size', 256, { min: 64, step: 8 }),
    radius: number('Radius', 0.3, { range: true, min: 0.1, max: 1, step: 0.1 }),
    maxAge: number('Max age', 750, { range: true, min: 300, max: 1000, step: 100 }),
  })

  return (
    <T.Mesh scale={7} onPointerMove={resource().onMove}>
      <T.PlaneGeometry />
      <T.MeshBasicMaterial map={resource().texture} />
    </T.Mesh>
  )
}

function UseTrailTextureScene() {
  return (
    <T.Suspense fallback={null}>
      <TrailMesh />
    </T.Suspense>
  )
}

export const UseTextureSceneSt = () => <UseTrailTextureScene />
UseTextureSceneSt.story = {
  name: 'Default',
}
