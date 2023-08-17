import { T, createPortal, useFrame } from '@solid-three/fiber'
import { Scene } from 'three'
import { Box, OrbitControls, PerspectiveCamera, Plane, useFBO } from '../../src'
import { Setup } from '../Setup'

import type { Camera } from 'three'
import type { OrbitControlsProps } from '../../src'

const args = {
  enableDamping: true,
  enablePan: true,
  enableRotate: true,
  enableZoom: true,
  reverseOrbit: false,
}

export const OrbitControlsStory = (props: OrbitControlsProps) => (
  <>
    <OrbitControls {...props} />
    <Box>
      <T.MeshBasicMaterial wireframe />
    </Box>
  </>
)

OrbitControlsStory.args = args
OrbitControlsStory.storyName = 'Default'

export default {
  title: 'Controls/OrbitControls',
  component: OrbitControls,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}

const CustomCamera = (props: OrbitControlsProps) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  let virtualCamera: Camera
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
      <Plane args={[4, 4, 4]}>
        <T.MeshBasicMaterial map={fbo.texture} />
      </Plane>

      {createPortal(
        <>
          <Box>
            <T.MeshBasicMaterial wireframe />
          </Box>
          {/* s3f:  ref of PerspectiveCamera does not accept Camera */}
          <PerspectiveCamera name="FBO Camera" ref={virtualCamera!} position={[0, 0, 5]} />
          <OrbitControls camera={virtualCamera} {...props} />

          {/* @ts-ignore */}
          <T.Color attach="background" args={['hotpink']} />
        </>,
        virtualScene
      )}
    </>
  )
}

export const CustomCameraStory = (props: OrbitControlsProps) => <CustomCamera {...props} />

CustomCameraStory.args = args
CustomCameraStory.storyName = 'Custom Camera'
