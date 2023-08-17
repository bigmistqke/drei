import { withKnobs } from '@storybook/addon-knobs'
import { IcosahedronGeometry, Vector3 } from 'three'

import { T } from '@solid-three/fiber'
import { Environment, Wireframe } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Staging/Wireframe',
  component: Wireframe,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(2, 2, 2)}>{storyFn()}</Setup>],
}

function WireframeScene() {
  const geom = new IcosahedronGeometry(1, 16)

  return (
    <T.Suspense fallback={null}>
      <T.Mesh>
        <T.IcosahedronGeometry args={[1, 16]} />
        <T.MeshPhysicalMaterial color="red" roughness={0.2} metalness={1} />

        <Wireframe stroke="white" squeeze dash />
      </T.Mesh>

      <T.Mesh position={[0, 0, -2.5]}>
        <T.TorusKnotGeometry />
        <T.MeshBasicMaterial color="red" />

        <Wireframe simplify stroke="white" squeeze dash fillMix={1} fillOpacity={0.2} />
      </T.Mesh>

      <T.Group position={[-2.5, 0, -2.5]}>
        <Wireframe fill="blue" geometry={geom} stroke="white" squeeze dash fillMix={1} fillOpacity={0.2} />
      </T.Group>

      <T.Mesh position={[-2.5, 0, 0]}>
        <T.SphereGeometry args={[1, 16, 16]} />
        <T.ShaderMaterial
          vertexShader={
            /* glsl */ `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `
          }
          fragmentShader={
            /* glsl */ `
      
        void main() {
          float edge = getWireframe();
          gl_FragColor = vec4(1.0, 1.0, 0.0, edge);
        }
      `
          }
        />

        <Wireframe stroke="white" squeeze dash />
      </T.Mesh>

      {/* s3f:    Does not load the correct hdri file */}
      <Environment background preset="sunset" blur={0.2} />
    </T.Suspense>
  )
}

export const WireframeSt = () => <WireframeScene />
WireframeSt.storyName = 'Default'
