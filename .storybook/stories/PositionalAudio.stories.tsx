import { For } from 'solid-js'
import { Vector3 } from 'three'

import { T } from '@solid-three/fiber'
import { OrbitControls, PositionalAudio } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Abstractions/PositionalAudio',
  component: PositionalAudioScene,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 20)}>{storyFn()}</Setup>],
}

function PositionalAudioScene() {
  const args = [
    {
      position: new Vector3(10, 0, 10),
      url: 'sounds/1.mp3',
    },
    {
      position: new Vector3(-10, 0, 10),
      url: 'sounds/2.mp3',
    },
    {
      position: new Vector3(10, 0, -10),
      url: 'sounds/3.mp3',
    },
    {
      position: new Vector3(-10, 0, -10),
      url: 'sounds/4.mp3',
    },
  ]

  return (
    <>
      <T.Suspense fallback={null}>
        <T.Group position={[0, 0, 5]}>
          <For each={args}>
            {(arg) => (
              <T.Mesh position={arg.position}>
                <T.SphereGeometry />
                <T.MeshBasicMaterial wireframe color="hotpink" />
                <PositionalAudio url={arg.url} autoplay />
              </T.Mesh>
            )}
          </For>
        </T.Group>
      </T.Suspense>
      <OrbitControls />
    </>
  )
}

export const PositionalAudioSceneSt = () => <PositionalAudioScene />
PositionalAudioSceneSt.story = {
  name: 'Default',
}
