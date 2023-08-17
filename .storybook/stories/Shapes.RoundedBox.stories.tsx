import { number, withKnobs } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { T } from '@solid-three/fiber'
import { RoundedBox } from '../../src'

export default {
  title: 'Shapes/RoundedBox',
  component: RoundedBox,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(-30, 30, 30)}>{storyFn()}</Setup>],
}

function RoundedBoxScene() {
  const turntable = useTurntable()

  return (
    <RoundedBox
      ref={turntable}
      args={[number('width', 25), number('height', 25), number('depth', 25)]}
      radius={number('radius', 1)}
      smoothness={number('smoothness', 5)}
    >
      <T.MeshPhongMaterial color="#f3f3f3" wireframe />
    </RoundedBox>
  )
}

export const RoundedBoxSt = () => <RoundedBoxScene />
RoundedBoxSt.storyName = 'Default'

function RoundedBoxScene2() {
  const turntable = useTurntable()

  return (
    <>
      <T.SpotLight position={[35, 35, 35]} intensity={2} />
      <RoundedBox
        ref={turntable}
        args={[number('width', 25), number('height', 25), number('depth', 25)]}
        radius={number('radius', 8)}
        smoothness={number('smoothness', 5)}
      >
        <T.MeshPhongMaterial color="#f3f3f3" />
      </RoundedBox>
    </>
  )
}

export const RoundedBoxSt2 = () => <RoundedBoxScene2 />
RoundedBoxSt2.storyName = 'Solid'
