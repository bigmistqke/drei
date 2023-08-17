import { Primitive, T, useFrame } from '@solid-three/fiber'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { Show, createSignal } from 'solid-js'
import { Box, useCubeCamera } from '../../src'
import { processProps } from '../../src/helpers/processProps'

export default {
  title: 'misc/useCubeCamera',
  component: useCubeCamera,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 10, 40)}>{storyFn()}</Setup>],
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      AxisHelper: object
    }
  }
}

// s3f    there is a bug currently where the second cubetexture is incorrectly positioned (or something)
//        unclear what the reason is. The bug is also present in r3f.
//        if the pink box is placed before the cube-textures are added it is rendered correctly
function Sphere(_props) {
  const [props, rest] = processProps(_props, { offset: 0 }, ['offset'])
  let ref: THREE.Mesh

  const { fbo, camera, update } = useCubeCamera()

  useFrame(({ clock }) => {
    ref!.position.y = Math.sin(props.offset + clock.elapsedTime) * 5
    ref!.visible = false
    update()
    ref!.visible = true
  })

  return (
    <T.Group {...rest}>
      <T.Mesh ref={ref!}>
        <Primitive object={camera()} />
        <T.SphereGeometry args={[5, 64, 64]} />
        <Show when={fbo()?.texture}>
          <T.MeshStandardMaterial color="white" roughness={0} metalness={1} envMap={fbo().texture} />
        </Show>
      </T.Mesh>
    </T.Group>
  )
}

function Scene() {
  const [visible, setVisible] = createSignal(true)
  return (
    <>
      <T.Fog attach="fog" args={['#f0f0f0', 100, 200]} />

      <Sphere position={[-10, 10, 0]} />
      <Sphere position={[10, 9, 0]} offset={2000} />

      <Box material-color="hotpink" args={[5, 5, 5]} position-y={2.5} onClick={() => setVisible((bool) => !bool)} />

      <T.GridHelper args={[100, 10]} />
    </>
  )
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'
