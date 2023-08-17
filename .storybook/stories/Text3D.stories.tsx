import { withKnobs } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Center, Float, Text, Text3D } from '../../src'

export default {
  title: 'Abstractions/Text3D',
  component: Text,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function Text3DScene() {
  return (
    <T.Suspense fallback={null}>
      <T.Color args={[0, 0, 0]} attach="background" />
      <Center>
        <Float floatIntensity={5} speed={2}>
          <Text3D font={'/fonts/helvetiker_regular.typeface.json'} bevelEnabled bevelSize={0.05}>
            Text 3D
            <T.MeshNormalMaterial />
          </Text3D>
        </Float>
      </Center>
    </T.Suspense>
  )
}

export const Text3DSt = () => <Text3DScene />
Text3DSt.storyName = 'Default'
