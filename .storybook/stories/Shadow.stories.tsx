import { T, useFrame } from '@solid-three/fiber'
import { Mesh } from 'three'

import { Setup } from '../Setup'

import { Icosahedron, Plane, Shadow } from '../../src'

export default {
  title: 'Misc/Shadow',
  component: Shadow,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function ShadowScene() {
  let shadow: Mesh
  let mesh: Mesh

  useFrame(({ clock }) => {
    shadow.scale.x = Math.sin(clock.getElapsedTime()) + 3
    shadow.scale.y = Math.sin(clock.getElapsedTime()) + 3

    mesh.position.y = Math.sin(clock.getElapsedTime()) + 2.5
  })

  return (
    <>
      <Icosahedron ref={mesh!} args={[1, 2]} position-y={2}>
        <T.MeshBasicMaterial color="lightblue" wireframe />
      </Icosahedron>
      <Shadow ref={shadow!} scale={[2, 2, 2]} position-y={0.1} rotation-x={-Math.PI / 2} />

      <Plane args={[4, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <T.MeshBasicMaterial color="white" />
      </Plane>
    </>
  )
}

export const ShadowSt = () => <ShadowScene />
ShadowSt.storyName = 'Default'
