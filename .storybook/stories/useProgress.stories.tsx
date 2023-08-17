import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Primitive, T } from '@solid-three/fiber'
import { boolean, withKnobs } from '@storybook/addon-knobs'
import { Environment, Html, Loader, useGLTF, useProgress } from '../../src'

export default {
  title: 'Misc/useProgress',
  component: useProgress,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function Helmet() {
  const resource = useGLTF('https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf')

  return <Primitive object={resource()?.nodes['node_damagedHelmet_-6514']} />
}

function Shoe() {
  const resource = useGLTF(
    'https://threejs.org/examples/models/gltf/MaterialsVariantsShoe/glTF/MaterialsVariantsShoe.gltf'
  )

  return <Primitive object={resource()?.nodes['Shoe']} />
}

function CustomLoader() {
  const progress = useProgress()
  return (
    <Html center>
      <span style={{ color: 'black' }}>{progress.progress} % loaded</span>
    </Html>
  )
}

function LoadExtras() {
  return (
    <T.Suspense fallback={<CustomLoader />}>
      <Environment preset={'studio'} />
      <Shoe />
    </T.Suspense>
  )
}

function UseProgressScene() {
  return (
    <T.Suspense fallback={<CustomLoader />}>{boolean('Load extras', false) ? <LoadExtras /> : <Helmet />}</T.Suspense>
  )
}

export const UseProgressSceneSt = () => <UseProgressScene />
UseProgressSceneSt.story = {
  name: 'Default',
}

export function WithOutOfTheBoxLoader(props) {
  return (
    <T.Suspense
      fallback={
        <Html>
          <Loader />
        </Html>
      }
    >
      {boolean('Load extras', false) ? <LoadExtras /> : <Helmet />}
    </T.Suspense>
  )
}
