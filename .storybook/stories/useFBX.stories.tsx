import { Vector3 } from 'three'

import { T } from '@solid-three/fiber'
import { useCubeTexture, useFBX } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Loaders/FBX',
  component: useFBX,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function SuzanneFBX() {
  const fbx = useFBX('suzanne/suzanne.fbx')
  const envMap = useCubeTexture(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'], { path: 'cube/' })
  // s3f:   monkey is completely black with envMap defined.
  return <T.Mesh {...fbx()?.children[0]} material-envMap={envMap()} material-color="white" material-reflectivity={1} />
}

function UseFBXScene() {
  return (
    <T.Suspense fallback={null}>
      <SuzanneFBX />
    </T.Suspense>
  )
}

export const UseFBXSceneSt = () => <UseFBXScene />
UseFBXSceneSt.story = {
  name: 'Default',
}
