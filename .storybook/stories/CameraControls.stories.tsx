import { Portal, T, useFrame } from '@solid-three/fiber'
import { Scene } from 'three'

import { Box, CameraControls, PerspectiveCamera, Plane, useFBO } from '../../src'
import { Setup } from '../Setup'

import type { CameraControlsProps } from '../../src'

const args = {}

export const CameraControlsStory = (props: CameraControlsProps) => {
  let cameraControlRef: CameraControls | null = null

  return (
    <>
      <CameraControls ref={cameraControlRef!} {...props} />
      <Box
        onClick={() => {
          cameraControlRef?.rotate(Math.PI / 4, 0, true)
        }}
      >
        <T.MeshBasicMaterial wireframe />
      </Box>
    </>
  )
}

CameraControlsStory.args = args
CameraControlsStory.storyName = 'Default'

export default {
  title: 'Controls/CameraControls',
  component: CameraControls,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}

// s3f:   this story currently fails.
//        it only starts working when u hmr for some reason
//        in the playground identical code works.
const CustomCamera = (props: CameraControlsProps) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  let virtualCamera: CameraControls['camera']
  let cameraControlRef: CameraControls | null
  const virtualScene = new Scene()

  useFrame(({ gl }) => {
    if (virtualCamera) {
      gl.setRenderTarget(fbo)
      gl.render(virtualScene, virtualCamera)

      gl.setRenderTarget(null)
    }
  })

  return (
    <>
      <Plane
        args={[4, 4, 4]}
        onClick={() => {
          cameraControlRef?.rotate(Math.PI / 4, 0, true)
        }}
      >
        <T.MeshBasicMaterial map={fbo.texture} />
      </Plane>
      <Portal container={virtualScene}>
        <Box>
          <T.MeshBasicMaterial />
        </Box>

        <PerspectiveCamera name="FBO Camera" ref={virtualCamera!} position={[0, 0, 5]} />
        <CameraControls ref={cameraControlRef!} camera={virtualCamera!} />

        {/* @ts-ignore */}
        {/* <T.Color attach="background" args={['hotpink']} /> */}
      </Portal>
    </>
  )
}

export const CustomCameraStory = (props: CameraControlsProps) => <CustomCamera {...props} />

CustomCameraStory.args = args
CustomCameraStory.storyName = 'Custom Camera'
