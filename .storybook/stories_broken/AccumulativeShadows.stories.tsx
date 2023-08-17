import { T } from '@solid-three/fiber'
import { Suspense } from 'solid-js'

import { Setup } from '../Setup'

import { AccumulativeShadows, Environment, OrbitControls, RandomizedLight } from '../../src'

export default {
  title: 'Staging/AccumulativeShadows',
  component: AccumulativeShadowScene,
  decorators: [(storyFn) => <Setup>{storyFn}</Setup>],
}

function AccumulativeShadowScene() {
  return (
    <Suspense fallback={null}>
      <T.Color attach="background" args={['goldenrod']} />
      <Suzi rotation={[-0.63, 0, 0]} scale={2} position={[0, -1.175, 0]} />
      <AccumulativeShadows
        temporal
        frames={100}
        color="goldenrod"
        alphaTest={0.65}
        opacity={2}
        scale={14}
        position={[0, -0.5, 0]}
      >
        <RandomizedLight amount={8} radius={4} ambient={0.5} bias={0.001} position={[5, 5, -10]} />
      </AccumulativeShadows>
      <OrbitControls autoRotate={true} />
      <Environment preset="city" />
    </Suspense>
  )
}

function Suzi(props) {
  /* const resource = useGLTF(
    'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/suzanne-high-poly/model.gltf'
  ) */
  /* createEffect(() => {
    when(resource)((resource) => {

      resource.scene.traverse((obj) => obj.isMesh && (obj.receiveShadow = obj.castShadow = true))

      applyProps(resource.materials.default, {
        color: 'orange',
        roughness: 0,
        normalMap: new THREE.CanvasTexture(
          new FlakesTexture(),
          THREE.UVMapping,
          THREE.RepeatWrapping,
          THREE.RepeatWrapping
        ),
        'normalMap-flipY': false,
        'normalMap-repeat': [40, 40],
        normalScale: [0.05, 0.05],
      })
    })
  }) */

  return (
    <>
      {/* <Show when={resource()}>
     <Primitive object={resource()?.scene} {...props} />
   </Show> */}
    </>
  )
}

export const AccumulativeShadowSt = () => <AccumulativeShadowScene />
AccumulativeShadowSt.storyName = 'Default'
