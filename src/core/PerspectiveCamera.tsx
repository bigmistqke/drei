import { T, ThreeProps, useFrame, useThree } from '@solid-three/fiber'
import { JSX, createEffect, mergeProps, onCleanup, splitProps, untrack } from 'solid-js'
import * as THREE from 'three'
import { PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { RefComponent } from '../helpers/typeHelpers'
import { useFBO } from './useFBO'

const isFunction = (node: any): node is Function => typeof node === 'function'

type Props = Omit<ThreeProps<'PerspectiveCamera'>, 'children'> & {
  /** Registers the camera as the system default, fiber will start rendering with it */
  makeDefault?: boolean
  /** Making it manual will stop responsiveness and you have to calculate aspect ratio yourself. */
  manual?: boolean
  /** The contents will either follow the camera, or be hidden when filming if you pass a function */
  children?: JSX.Element | ((texture: THREE.Texture) => JSX.Element)
  /** Number of frames to render, Infinity */
  frames?: number
  /** Resolution of the FBO, 256 */
  resolution?: number
  /** Optional environment map for functional use */
  envMap?: THREE.Texture
}

export const PerspectiveCamera: RefComponent<THREE.Camera, Props> = (_props) => {
  const [props, rest] = splitProps(
    mergeProps(
      {
        resolution: 256,
        frames: Infinity,
      },
      _props
    ),
    ['ref', 'envMap', 'resolution', 'frames', 'makeDefault', 'children']
  )
  const store = useThree()
  const cameraRef = createRef<PerspectiveCameraImpl>()

  let groupRef: THREE.Group = null!
  const fbo = useFBO(props.resolution)

  createEffect(() => {
    // s3f:   store.size.height is initially 0
    if (!rest.manual && store.size.height) {
      cameraRef.ref!.aspect = store.size.width / store.size.height
    }
  })

  createEffect(() => {
    cameraRef.ref!.updateProjectionMatrix()
  })

  let count = 0
  let oldEnvMap: THREE.Color | THREE.Texture | null = null
  const functional = isFunction(props.children)

  useFrame((state) => {
    if (functional && (props.frames === Infinity || count < props.frames)) {
      groupRef.visible = false
      state.gl.setRenderTarget(fbo)
      oldEnvMap = state.scene.background
      if (props.envMap) state.scene.background = props.envMap
      state.gl.render(state.scene, cameraRef.ref!)
      state.scene.background = oldEnvMap
      state.gl.setRenderTarget(null)
      groupRef.visible = true
      count++
    }
  })

  createEffect(() => {
    if (props.makeDefault) {
      const oldCam = untrack(() => store.camera)
      store.set({ camera: cameraRef.ref! })
      onCleanup(() => {
        store.set({ camera: oldCam })
      })
    }
    // The camera should not be part of the dependency list because this components camera is a stable reference
    // that must exchange the default, and clean up after itself on unmount.
  })

  return (
    <>
      <T.PerspectiveCamera ref={mergeRefs(cameraRef, props)} {...rest}>
        {!functional && props.children}
      </T.PerspectiveCamera>
      <T.Group ref={groupRef}>
        {functional && typeof props.children === 'function' && props.children(fbo.texture)}
      </T.Group>
    </>
  )
}
