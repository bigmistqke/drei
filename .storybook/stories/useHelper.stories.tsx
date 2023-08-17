import { BoxHelper, Camera, CameraHelper } from 'three'
import { VertexNormalsHelper } from 'three-stdlib'

import { Setup } from '../Setup'

import { T, useFrame } from '@solid-three/fiber'
import { Component, createSignal } from 'solid-js'
import { PerspectiveCamera, Sphere, useHelper } from '../../src'
import { when } from '../../src/helpers/when'

export default {
  title: 'Gizmos/useHelper',
  component: useHelper,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
  args: {
    showHelper: true,
  },
  argTypes: {
    showHelper: {
      type: 'boolean',
    },
  },
}

type StoryProps = {
  showHelper: boolean
}

const Scene: Component<StoryProps> = (props) => {
  let mesh
  useHelper(() => props.showHelper && mesh, BoxHelper, 'royalblue')
  useHelper(() => props.showHelper && mesh, VertexNormalsHelper, 1, 0xff0000)

  return (
    <Sphere ref={mesh!}>
      <T.MeshBasicMaterial />
    </Sphere>
  )
}

export const DefaultStory = (args: StoryProps) => <Scene {...args} />
DefaultStory.storyName = 'Default'

// s3f:   - the following error: THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.
//        - the buffer-geometry created with CameraHelper has boundingSphere null
//        - the test-file works if we save while the file is open
const CameraScene: Component<StoryProps> = (props) => {
  const [camera, setCamera] = createSignal<Camera>()

  useHelper(() => props.showHelper && camera(), CameraHelper)

  useFrame(({ clock }) =>
    when(camera)((camera) => {
      const t = clock.getElapsedTime()
      camera.lookAt(0, 0, 0)
      camera.position.x = Math.sin(t) * 4
      camera.position.z = Math.cos(t) * 4
    })
  )

  return <PerspectiveCamera makeDefault={false} position={[0, 3, 3]} near={1} far={4} ref={setCamera} />
}

export const CameraStory = (args: StoryProps) => <CameraScene {...args} />
CameraStory.storyName = 'Camera Helper'
