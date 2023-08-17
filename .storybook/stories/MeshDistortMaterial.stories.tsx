import { ThreeProps, useFrame } from '@solid-three/fiber'

import { number, withKnobs } from '@storybook/addon-knobs'

import { Icosahedron, MeshDistortMaterial } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Shaders/MeshDistortMaterial',
  component: MeshDistortMaterial,
  decorators: [withKnobs, (storyFn) => <Setup> {storyFn()}</Setup>],
}

function MeshDistortMaterialScene() {
  return (
    <Icosahedron args={[1, 4]}>
      <MeshDistortMaterial
        color="#f25042"
        speed={number('Speed', 1, { range: true, max: 10, step: 0.1 })}
        distort={number('Distort', 0.6, { range: true, min: 0, max: 1, step: 0.1 })}
        radius={number('Radius', 1, { range: true, min: 0, max: 1, step: 0.1 })}
      />
    </Icosahedron>
  )
}

export const MeshDistortMaterialSt = () => <MeshDistortMaterialScene />
MeshDistortMaterialSt.storyName = 'Default'

function MeshDistortMaterialRefScene() {
  let material: ThreeProps<'DistortMaterialImpl'>

  useFrame(({ clock }) => {
    material.distort = Math.sin(clock.getElapsedTime())
  })

  return (
    <Icosahedron args={[1, 4]}>
      {/* s3f:  ref of MeshDistorMaterial is MeshPhysicalMaterial */}
      <MeshDistortMaterial color="#f25042" ref={material!} />
    </Icosahedron>
  )
}

export const MeshDistortMaterialRefSt = () => <MeshDistortMaterialRefScene />
MeshDistortMaterialRefSt.storyName = 'Ref'
