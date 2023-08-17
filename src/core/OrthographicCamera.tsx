import { T, useFrame, useThree } from '@solid-three/fiber'
import { JSX, Show, createEffect, on, onCleanup, untrack } from 'solid-js'
import * as THREE from 'three'
import { OrthographicCamera as OrthographicCameraImpl } from 'three'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { useFBO } from './useFBO'

const isFunction = (node: any): node is Function => typeof node === 'function'

type Props = Omit<Parameters<typeof T.OrthographicCamera>[0], 'children'> & {
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

export const OrthographicCamera: RefComponent<THREE.Camera, Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      resolution: 256,
      frames: Infinity,
    },
    ['ref', 'envMap', 'resolution', 'frames', 'children', 'makeDefault']
  )

  const store = useThree()
  const cameraRef = createRef<OrthographicCameraImpl>(null!)
  let groupRef: THREE.Group = null!
  const fbo = useFBO(props.resolution)

  createEffect(
    on(
      () => [store.size, rest],
      () => {
        if (!rest.manual) {
          cameraRef.ref.updateProjectionMatrix()
        }
      }
    )
  )

  createEffect(() => {})

  createEffect(() => {
    if (props.makeDefault) {
      const oldCam = untrack(() => store.camera)
      store.set(() => ({ camera: cameraRef.ref! }))
      cameraRef.ref.updateProjectionMatrix()
      onCleanup(() => store.set(() => ({ camera: oldCam })))
    }
  })

  let count = 0
  let oldEnvMap: THREE.Color | THREE.Texture | null = null
  const functional = () => isFunction(props.children)
  useFrame((state) => {
    if (functional() && (props.frames === Infinity || count < props.frames)) {
      groupRef.visible = false
      state.gl.setRenderTarget(fbo)
      oldEnvMap = state.scene.background
      if (props.envMap) state.scene.background = props.envMap
      state.gl.render(state.scene, cameraRef.ref)
      state.scene.background = oldEnvMap
      state.gl.setRenderTarget(null)
      groupRef.visible = true
      count++
    }
  })

  createEffect(() => console.log(store.size))

  return (
    <>
      <Show when={store.size}>
        <T.OrthographicCamera
          left={store.size.width / -2}
          right={store.size.width / 2}
          top={store.size.height / 2}
          bottom={store.size.height / -2}
          ref={mergeRefs(cameraRef, props)}
          {...rest}
        >
          <Show when={functional()}>{props.children as JSX.Element}</Show>
        </T.OrthographicCamera>
        <T.Group ref={groupRef}>
          <Show when={functional()}>{(props.children as (texture: any) => JSX.Element)?.(fbo.texture)}</Show>
        </T.Group>
      </Show>
    </>
  )
}
