import * as THREE from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { T } from '@solid-three/fiber'
import { Lathe } from '../../src'

export default {
  title: 'Shapes/Lathe',
  component: Lathe,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(-30, 30, 30)}>{storyFn()}</Setup>],
}

function LatheScene() {
  const points = (() => {
    const _points: THREE.Vector2[] = []
    for (let i = 0; i < 10; i++) {
      _points.push(new THREE.Vector2(Math.sin(i * 0.2) * 10 + 5, (i - 5) * 2))
    }

    return _points
  })()

  const turntable = useTurntable()

  return (
    <Lathe ref={turntable} args={[points]}>
      <T.MeshPhongMaterial color="#f3f3f3" wireframe />
    </Lathe>
  )
}

export const LatheSt = () => <LatheScene />
LatheSt.storyName = 'Default'
