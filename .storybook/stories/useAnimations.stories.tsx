import { number, select, withKnobs } from '@storybook/addon-knobs'
import { Resource, Show, createEffect, createSignal } from 'solid-js'
import { Vector3 } from 'three'
import { GLTF } from 'three-stdlib'

import { Setup } from '../Setup'

import { Primitive, T, ThreeProps } from '@solid-three/fiber'
import { useAnimations, useGLTF, useMatcapTexture } from '../../src'

export default {
  title: 'Abstractions/useAnimations',
  component: useAnimations,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 3)}>{storyFn()}</Setup>, withKnobs],
}

type GLTFResult = GLTF & {
  nodes: {
    YB_Body: THREE.SkinnedMesh
    YB_Joints: THREE.SkinnedMesh
    mixamorigHips: THREE.Bone
  }
  materials: {
    YB_Body: THREE.MeshStandardMaterial
    YB_Joints: THREE.MeshStandardMaterial
  }
}

type AnimationControllerProps = {
  ybotRef: THREE.Group | undefined | null
  animations: THREE.AnimationClip[]
}

function AnimationController(props: AnimationControllerProps) {
  const animations = useAnimations(props.animations, () => props.ybotRef)

  // Storybook Knobs
  const actionOptions = Object.keys(animations().actions)
  const selectedAction = select('Animation', actionOptions, actionOptions[2])
  const blendDuration = number('Blend duration', 0.5, {
    range: true,
    min: 0,
    max: 2,
    step: 0.1,
  })

  createEffect(() => {
    const keys = Object.keys(animations().actions)

    animations().actions[keys[2]]?.reset().fadeIn(blendDuration).play()
    return () => void animations().actions[selectedAction]?.fadeOut(blendDuration)
  })

  return null
}

function YBotModel(props: ThreeProps<'Group'>) {
  const [ybotRef, setYbotRef] = createSignal<THREE.Group>()
  const gltf = useGLTF('ybot.glb') as Resource<GLTFResult>
  const [matcapBody] = useMatcapTexture('293534_B2BFC5_738289_8A9AA7', 1024)
  const [matcapJoints] = useMatcapTexture('3A2412_A78B5F_705434_836C47', 1024)

  // s3f    is somehow a lot lighter with the inner `T.Suspense`
  //        unclear reason why
  return (
    // <T.Suspense>
    <T.Group ref={setYbotRef} {...props} dispose={null}>
      <T.Group rotation={[Math.PI / 2, 0, 0]} scale={[0.01, 0.01, 0.01]}>
        <Primitive object={gltf()?.nodes.mixamorigHips} />
        <T.SkinnedMesh geometry={gltf()?.nodes.YB_Body.geometry} skeleton={gltf()?.nodes.YB_Body.skeleton}>
          {/* s3f   skinning-prop is undefined */}
          <T.MeshMatcapMaterial matcap={matcapBody()} skinning />
        </T.SkinnedMesh>
        <T.SkinnedMesh geometry={gltf()?.nodes.YB_Joints.geometry} skeleton={gltf()?.nodes.YB_Joints.skeleton}>
          <T.MeshMatcapMaterial matcap={matcapJoints()} skinning />
        </T.SkinnedMesh>
      </T.Group>
      <Show when={gltf()?.animations}>
        <AnimationController ybotRef={ybotRef()} animations={gltf()!.animations} />
      </Show>
    </T.Group>
    // </T.Suspense>
  )
}

// useGLTF.preload('ybot.glb')

function UseAnimationsScene() {
  return (
    <T.Suspense>
      <YBotModel position={[0, -1, 0]} />
    </T.Suspense>
  )
}

export const UseAnimationsSt = () => <UseAnimationsScene />
UseAnimationsSt.storyName = 'Default'
