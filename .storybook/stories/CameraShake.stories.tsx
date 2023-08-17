import { T, useFrame } from '@solid-three/fiber'
import * as THREE from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { Setup } from '../Setup'

import { CameraShake, OrbitControls } from '../../src'

const frequencyArgType = {
  control: {
    max: 10,
    min: 0,
    step: 0.1,
    type: 'range',
  },
}

const numberArgType = {
  control: {
    max: 1,
    min: 0,
    step: 0.05,
    type: 'range',
  },
}

const args = {
  maxPitch: 0.05,
  maxRoll: 0.05,
  maxYaw: 0.05,
  pitchFrequency: 0.8,
  rollFrequency: 0.8,
  yawFrequency: 0.8,
}

const argTypes = {
  maxPitch: numberArgType,
  maxRoll: numberArgType,
  maxYaw: numberArgType,
  pitchFrequency: frequencyArgType,
  rollFrequency: frequencyArgType,
  yawFrequency: frequencyArgType,
}

export default {
  title: 'Staging/CameraShake',
  component: CameraShake,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 10)} controls={false}>
        {storyFn()}
      </Setup>
    ),
  ],
}

function Scene() {
  let cube: THREE.Mesh

  useFrame(() => {
    if (cube) {
      cube.rotation.x = cube.rotation.y += 0.01
    }
  })

  return (
    <>
      <T.Mesh ref={cube!}>
        <T.BoxGeometry args={[2, 2, 2]} />
        <T.MeshStandardMaterial wireframe color="white" />
      </T.Mesh>
      <T.Mesh position={[0, -6, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <T.PlaneGeometry args={[200, 200, 75, 75]} />
        <T.MeshBasicMaterial wireframe color="red" side={THREE.DoubleSide} />
      </T.Mesh>
    </>
  )
}

export const CameraShakeStory = ({ ...args }) => (
  <>
    <CameraShake {...args} />
    <Scene />
  </>
)

CameraShakeStory.args = args
CameraShakeStory.argTypes = argTypes
CameraShakeStory.storyName = 'Default'

export const CameraShakeWithOrbitControlsStory = ({ ...args }) => {
  let controlsRef: OrbitControlsImpl = null!
  return (
    <>
      <OrbitControls ref={controlsRef} />
      <CameraShake {...args} controls={controlsRef} />
      <Scene />
    </>
  )
}

CameraShakeWithOrbitControlsStory.args = args
CameraShakeWithOrbitControlsStory.argTypes = argTypes
CameraShakeWithOrbitControlsStory.storyName = 'With OrbitControls'
