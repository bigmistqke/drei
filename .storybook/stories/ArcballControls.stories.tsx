import { Portal, T, useFrame } from '@solid-three/fiber'
import { Scene } from 'three'

import { ArcballControls, Box, PerspectiveCamera, Plane, useFBO } from '../../src'
import { Setup } from '../Setup'

import type { OrthographicCamera, PerspectiveCamera as PerspectiveCameraType } from 'three'
import type { ArcballControlsProps } from '../../src'

const args = {
  enablePan: true,
  enableRotate: true,
  enableZoom: true,
}

export const ArcballControlsStory = (props: ArcballControlsProps) => (
  <>
    <ArcballControls {...props} />
    <Box>
      <T.MeshBasicMaterial wireframe />
    </Box>
  </>
)

ArcballControlsStory.args = args
ArcballControlsStory.storyName = 'Default'

export default {
  title: 'Controls/ArcballControls',
  component: ArcballControls,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}

const CustomCamera = (props: ArcballControlsProps) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  let virtualCamera: OrthographicCamera | PerspectiveCameraType
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
      <Portal container={virtualScene}>
        <Box>
          <T.MeshBasicMaterial wireframe />
        </Box>

        <PerspectiveCamera name="FBO Camera" ref={virtualCamera!} position={[0, 0, 5]} />

        <ArcballControls camera={virtualCamera!} {...props} />

        <T.Color attach="background" args={['hotpink']} />
      </Portal>
    </>
  )
}

export const CustomCameraStory = (props: ArcballControlsProps) => <CustomCamera {...props} />

CustomCameraStory.args = args
CustomCameraStory.storyName = 'Custom Camera'
