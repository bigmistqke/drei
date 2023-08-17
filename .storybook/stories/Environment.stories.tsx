import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { ContactShadows, Environment, OrbitControls } from '../../src'

import { T } from '@solid-three/fiber'
import { presetsObj } from '../../src/helpers/environment-assets'

export default {
  title: 'Staging/Environment',
  component: Environment,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(0, 0, 10)} controls={false}>
        <T.Suspense>{storyFn()}</T.Suspense>
      </Setup>
    ),
  ],
}

export const EnvironmentStory = (props) => {
  return (
    <>
      <Environment preset={props.preset} background={props.background} blur={props.blur} />
      <T.Mesh>
        <T.TorusKnotGeometry args={[1, 0.5, 128, 32]} />
        <T.MeshStandardMaterial metalness={1} roughness={0} color="white" />
      </T.Mesh>
      <OrbitControls autoRotate />
    </>
  )
}

const presets = Object.keys(presetsObj)

EnvironmentStory.args = {
  background: true,
  blur: 0,
  preset: presets[0],
}

EnvironmentStory.argTypes = {
  preset: {
    options: presets,
    control: {
      type: 'select',
    },
  },
  blur: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
}

EnvironmentStory.storyName = 'Default'

export const EnvironmentFilesStory = (props) => (
  <>
    <Environment
      background={props.background}
      path={`cube/`}
      files={[`px.png`, `nx.png`, `py.png`, `ny.png`, `pz.png`, `nz.png`]}
    />
    <T.Mesh>
      <T.TorusKnotGeometry args={[1, 0.5, 128, 32]} />
      <T.MeshStandardMaterial metalness={1} roughness={0} />
    </T.Mesh>
    <OrbitControls autoRotate />
  </>
)

EnvironmentFilesStory.args = {
  background: true,
}

EnvironmentFilesStory.storyName = 'Files'

export const EnvironmentGroundStory = (props) => {
  return (
    <>
      <Environment ground={{ height: props.height, radius: props.radius }} preset={props.preset} />
      <T.Mesh position={[0, 5, 0]}>
        <T.BoxGeometry args={[10, 10, 10]} />
        <T.MeshStandardMaterial color="white" metalness={1} roughness={0} />
      </T.Mesh>
      <ContactShadows resolution={1024} position={[0, 0, 0]} scale={100} blur={2} opacity={1} far={10} />
      <OrbitControls autoRotate />
      {/* <PerspectiveCamera position={[40, 40, 40]} makeDefault /> */}
    </>
  )
}

EnvironmentGroundStory.args = {
  height: 15,
  radius: 60,
  preset: 'park',
}

EnvironmentGroundStory.argTypes = {
  preset: {
    options: presets,
    control: {
      type: 'select',
    },
  },
  height: {
    control: {
      type: 'range',
      min: 0,
      max: 50,
      step: 0.1,
    },
  },
  radius: {
    control: {
      type: 'range',
      min: 0,
      max: 200,
      step: 1,
    },
  },
}

EnvironmentGroundStory.storyName = 'Ground'
