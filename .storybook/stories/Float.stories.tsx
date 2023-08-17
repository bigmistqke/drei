import { number, withKnobs } from '@storybook/addon-knobs'

import * as THREE from 'three'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Float } from '../../src'

export default {
  title: 'Staging/Float',
  component: Float,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 0, 10)}> {storyFn()}</Setup>],
}

function FloatScene() {
  let cube

  return (
    <>
      <T.Suspense fallback={null}>
        <Float
          position={[0, 1.1, 0]}
          floatingRange={[number('Min Floating Range', undefined), number('Max Floating Range', 1)]}
          rotation={[Math.PI / 3.5, 0, 0]}
          rotationIntensity={number('Rotation Intensity', 4)}
          floatIntensity={number('Float Intensity', 2)}
          speed={number('Speed', 5)}
        >
          <T.Mesh ref={cube}>
            <T.BoxGeometry args={[2, 2, 2]} />
            <T.MeshStandardMaterial wireframe color="white" />
          </T.Mesh>
        </Float>
      </T.Suspense>

      {/* ground plane */}
      <T.Mesh position={[0, -6, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <T.PlaneGeometry args={[200, 200, 75, 75]} />
        <T.MeshBasicMaterial wireframe color="red" side={THREE.DoubleSide} />
      </T.Mesh>
    </>
  )
}

export const FloatSt = () => <FloatScene />
FloatSt.storyName = 'Default'
