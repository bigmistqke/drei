import { Portal, T, useFrame } from '@solid-three/fiber'
import { createMemo } from 'solid-js'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { Box, PerspectiveCamera, TorusKnot, useFBO } from '../../src'

export default {
  title: 'Misc/useFBO',
  component: useFBO,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function SpinningThing() {
  let mesh: THREE.Mesh
  useFrame(() => {
    mesh.rotation.x = mesh.rotation.y = mesh.rotation.z += 0.01
  })
  return (
    <TorusKnot ref={mesh!} args={[1, 0.4, 100, 64]}>
      <T.MeshNormalMaterial />
    </TorusKnot>
  )
}

function UseFBOScene({ color = 'orange', ...props }) {
  let cam: THREE.Camera
  const scene = createMemo(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(color)
    return scene
  })
  const target = useFBO(props)

  useFrame((state) => {
    cam.position.z = 5 + Math.sin(state.clock.getElapsedTime() * 1.5) * 2
    state.gl.setRenderTarget(target)
    state.gl.render(scene(), cam)
    state.gl.setRenderTarget(null)
  })

  return (
    <>
      <PerspectiveCamera ref={cam!} position={[0, 0, 3]} />
      <Portal container={scene()}>
        <SpinningThing />
      </Portal>
      <Box args={[3, 3, 3]}>
        <T.MeshStandardMaterial map={target.texture} />
      </Box>
    </>
  )
}

export const UseFBOSt = () => <UseFBOScene />
UseFBOSt.storyName = 'Default'

export const UseFBOWithSettings = () => (
  <UseFBOScene color="blue" multisample samples={8} stencilBuffer={false} format={THREE.RGBFormat} />
)
UseFBOWithSettings.storyName = 'With settings'
