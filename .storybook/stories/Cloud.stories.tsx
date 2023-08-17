import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Cloud, OrbitControls } from '../../src'

export default {
  title: 'Staging/Cloud',
  component: Cloud,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const CloudStory = () => (
  <>
    <T.Suspense fallback={null}>
      {/* s3f:  no idea what args are supposed to do. those props lead to <T.Group {...rest} /> */}
      <Cloud position={[-4, -2, 0]} args={[3, 2]} />
      <Cloud position={[-4, 2, 0]} args={[3, 2]} />
      <Cloud args={[3, 2]} />
      <Cloud position={[4, -2, 0]} args={[3, 2]} />
      <Cloud position={[4, 2, 0]} args={[3, 2]} />
    </T.Suspense>
    <OrbitControls enablePan={false} zoomSpeed={0.5} />
  </>
)

CloudStory.storyName = 'Default'
