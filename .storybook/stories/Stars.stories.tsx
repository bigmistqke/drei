import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Plane, Stars } from '../../src'

export default {
  title: 'Staging/Stars',
  component: Stars,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function StarsScene() {
  return (
    <>
      {/* s3f: needed to add background-color to scene© to make stars visible */}
      <T.Color args={[0, 0, 0]} attach="background" />
      <Stars />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <T.MeshBasicMaterial color="black" wireframe />
      </Plane>
      <T.AxesHelper />
    </>
  )
}

export const StarsSt = () => <StarsScene />
StarsSt.storyName = 'Default'
