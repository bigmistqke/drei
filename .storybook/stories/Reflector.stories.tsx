import { T, useFrame } from '@solid-three/fiber'
import { createEffect, createMemo } from 'solid-js'
import { Mesh, RepeatWrapping, Vector2, Vector3 } from 'three'

import { Box, Environment, MeshReflectorMaterial, TorusKnot, useTexture } from '../../src'
import { when } from '../../src/helpers/when'
import { Setup } from '../Setup'

export default {
  title: 'Shaders/MeshReflectorMaterial',
  component: MeshReflectorMaterial,
  decorators: [
    (storyFn) => (
      <Setup cameraFov={20} cameraPosition={new Vector3(-2, 2, 6)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

/* s3f:   - blur-example not working 
          - distortion-example not working
          - `Feedback loop formed between Framebuffer and active Texture.`-error          
*/
function ReflectorScene(props: {
  blur?: [number, number]
  depthScale?: number
  distortion?: number
  normalScale?: number
  reflectorOffset?: number
}) {
  const roughness = useTexture('roughness_floor.jpeg')
  const normal = useTexture('NORM.jpg')
  const distortionMap = useTexture('dist_map.jpeg')
  let $box: Mesh
  const _normalScale = createMemo(() => new Vector2(props.normalScale || 0), [props.normalScale])

  createEffect(() => {
    when(distortionMap)((distortionMap) => {
      distortionMap.wrapS = distortionMap.wrapT = RepeatWrapping
      distortionMap.repeat.set(4, 4)
    })
  })

  useFrame(({ clock }) => {
    $box.position.y += Math.sin(clock.getElapsedTime()) / 25
    $box.rotation.y = clock.getElapsedTime() / 2
  })

  return (
    <>
      <T.Mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <T.PlaneGeometry args={[10, 10]} />
        <MeshReflectorMaterial
          resolution={1024}
          mirror={0.75}
          mixBlur={10}
          mixStrength={2}
          blur={props.blur || [0, 0]}
          minDepthThreshold={0.8}
          maxDepthThreshold={1.2}
          depthScale={props.depthScale || 0}
          depthToBlurRatioBias={0.2}
          debug={0}
          distortion={props.distortion || 0}
          distortionMap={distortionMap()}
          color="#a0a0a0"
          metalness={0.5}
          roughnessMap={roughness()}
          roughness={1}
          normalMap={normal()}
          normalScale={_normalScale()}
          reflectorOffset={props.reflectorOffset}
        />
      </T.Mesh>

      <Box args={[2, 3, 0.2]} position={[0, 1.6, -3]}>
        <T.MeshPhysicalMaterial color="hotpink" />
      </Box>
      <TorusKnot args={[0.5, 0.2, 128, 32]} ref={$box!} position={[0, 1, 0]}>
        <T.MeshPhysicalMaterial color="hotpink" />
      </TorusKnot>
      <T.SpotLight intensity={1} position={[10, 6, 10]} penumbra={1} angle={0.3} />
      <Environment preset="city" />
    </>
  )
}

export const ReflectorSt = () => (
  <T.Suspense fallback={null}>
    <ReflectorScene blur={[100, 500]} depthScale={2} distortion={0.3} normalScale={0.5} />
  </T.Suspense>
)
ReflectorSt.storyName = 'Default'

export const ReflectorPlain = () => (
  <T.Suspense fallback={null}>
    <ReflectorScene />
  </T.Suspense>
)
ReflectorPlain.storyName = 'Plain'

export const ReflectorBlur = () => (
  <T.Suspense fallback={null}>
    <ReflectorScene blur={[500, 500]} />
  </T.Suspense>
)
ReflectorBlur.storyName = 'Blur'

export const ReflectorDepth = () => (
  <T.Suspense fallback={null}>
    <ReflectorScene depthScale={2} />
  </T.Suspense>
)
ReflectorDepth.storyName = 'Depth'

export const ReflectorDistortion = () => (
  <T.Suspense fallback={null}>
    <ReflectorScene distortion={1} />
  </T.Suspense>
)
ReflectorDistortion.storyName = 'Distortion'

export const ReflectorNormalMap = () => (
  <T.Suspense fallback={null}>
    <ReflectorScene normalScale={0.5} />
  </T.Suspense>
)
ReflectorNormalMap.storyName = 'NormalMap'

export const ReflectorOffset = () => (
  <T.Suspense fallback={null}>
    <ReflectorScene reflectorOffset={1} />
  </T.Suspense>
)
ReflectorOffset.storyName = 'ReflectorOffset'
