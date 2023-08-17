import { withKnobs } from '@storybook/addon-knobs'
import * as THREE from 'three'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Facemesh, FacemeshDatas } from '../../src'

export default {
  title: 'Shapes/Facemesh',
  component: Facemesh,
  decorators: [
    withKnobs,
    (storyFn) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)} cameraFov={60}>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const FacemeshSt = ({ depth, origin, eyes, eyesAsOrigin, offset, offsetScalar, debug }) => (
  <>
    <T.Color attach="background" args={['#303030']} />
    <T.AxesHelper />

    <Facemesh
      depth={depth}
      origin={origin}
      eyes={eyes}
      faceBlendshapes={FacemeshDatas.SAMPLE_FACELANDMARKER_RESULT.faceBlendshapes[0]}
      eyesAsOrigin={eyesAsOrigin}
      offset={offset}
      facialTransformationMatrix={FacemeshDatas.SAMPLE_FACELANDMARKER_RESULT.facialTransformationMatrixes[0]}
      offsetScalar={offsetScalar}
      debug={debug}
      rotation-z={Math.PI}
    >
      <T.MeshStandardMaterial side={THREE.DoubleSide} color="#cbcbcb" flatShading={true} transparent opacity={0.98} />
    </Facemesh>
  </>
)
FacemeshSt.args = {
  depth: undefined,
  origin: undefined,
  eyes: undefined,
  eyesAsOrigin: undefined,
  offset: undefined,
  offsetScalar: undefined,
  debug: true,
}

FacemeshSt.argTypes = {
  depth: { control: { type: 'range', min: 0, max: 6.5, step: 0.01 } },
  origin: { control: 'select', options: [undefined, 168, 9] },
  eyes: { control: { type: 'boolean' } },
  eyesAsOrigin: { control: { type: 'boolean' } },
  offset: { control: { type: 'boolean' } },
  offsetScalar: { control: { type: 'range', min: 0, max: 200, step: 1 } },
  debug: { control: { type: 'boolean' } },
}

FacemeshSt.storyName = 'Default'
