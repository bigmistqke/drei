import { Vector3 } from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Accessor } from 'solid-js'
import { useGLTF } from '../../src'

export default {
  title: 'Loaders/GLTF',
  component: useGLTF,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

type GLTFResult = GLTF & {
  nodes: {
    Suzanne: THREE.Mesh
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
  }
}

function Suzanne() {
  const resource = useGLTF('suzanne.glb', true) as Accessor<GLTFResult | undefined>

  return <T.Mesh material={resource()?.materials['Material.001']} geometry={resource()?.nodes.Suzanne.geometry} />
}

function UseGLTFScene() {
  return (
    <T.Suspense fallback={null}>
      <Suzanne />
    </T.Suspense>
  )
}

export const UseGLTFSceneSt = () => <UseGLTFScene />
UseGLTFSceneSt.story = {
  name: 'Default',
}

// s3f:   local binaries aren't working
function SuzanneWithLocal() {
  const resource = useGLTF('suzanne.glb', '/draco-gltf/') as Accessor<GLTFResult | undefined>

  return (
    <T.Group dispose={null}>
      <T.Mesh material={resource()?.materials['Material.001']} geometry={resource()?.nodes.Suzanne.geometry} />
    </T.Group>
  )
}

function DracoLocalScene() {
  return (
    <T.Suspense fallback={null}>
      <SuzanneWithLocal />
    </T.Suspense>
  )
}

export const DracoLocalSceneSt = () => <DracoLocalScene />
DracoLocalSceneSt.story = {
  name: 'Local Binaries',
}
