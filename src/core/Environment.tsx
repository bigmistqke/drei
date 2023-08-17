import { Object3DNode, T, createPortal, extend, useFrame, useThree } from '@solid-three/fiber'
import { Accessor, JSXElement, Show, createMemo, createRenderEffect, onCleanup } from 'solid-js'
import { CubeCamera, CubeTexture, HalfFloatType, Scene, Texture, WebGLCubeRenderTarget } from 'three'
import { GroundProjectedEnv as GroundProjectedEnvImpl } from 'three-stdlib'
import { defaultProps } from '../helpers/defaultProps'
import { PresetsType } from '../helpers/environment-assets'
import { processProps } from '../helpers/processProps'
import { when } from '../helpers/when'
import { EnvironmentLoaderProps, useEnvironment } from './useEnvironment'

export type EnvironmentProps = {
  children?: JSXElement
  frames?: number
  near?: number
  far?: number
  resolution?: number
  background?: boolean | 'only'
  blur?: number
  map?: THREE.Texture
  preset?: PresetsType
  scene?: Scene | Accessor<THREE.Scene>
  ground?:
    | boolean
    | {
        radius?: number
        height?: number
        scale?: number
      }
} & EnvironmentLoaderProps

const isAccessor = (obj: any): obj is Accessor<THREE.Scene> => typeof obj === 'function'
const resolveScene = (scene: THREE.Scene | Accessor<THREE.Scene>) => (isAccessor(scene) ? scene() : scene)

// s3f: we could mb prevent unnecessary cleanups by passing accessors instead of raw values
function setEnvProps(
  background: boolean | 'only',
  scene: Scene | Accessor<Scene> | undefined,
  defaultScene: Scene,
  texture: Texture,
  blur = 0
) {
  const target = resolveScene(scene || defaultScene)
  const oldbg = target.background
  const oldenv = target.environment

  // @ts-ignore
  const oldBlur = target.backgroundBlurriness || 0
  if (background !== 'only') target.environment = texture
  if (background) target.background = texture
  // @ts-ignore
  if (background && target.backgroundBlurriness !== undefined) target.backgroundBlurriness = blur
  return () => {
    if (background !== 'only') target.environment = oldenv
    if (background) target.background = oldbg
    // @ts-ignore
    if (background && target.backgroundBlurriness !== undefined) target.backgroundBlurriness = oldBlur
  }
}

export function EnvironmentMap(_props: EnvironmentProps) {
  const props = defaultProps(_props, { background: false })
  const store = useThree()
  createRenderEffect(() => {
    if (props.map) {
      const cleanup = setEnvProps(props.background, props.scene, store.scene, props.map, props.blur)
      onCleanup(cleanup)
    }
  })
  return null
}

export function EnvironmentCube(_props: EnvironmentProps) {
  const [props, rest] = processProps(_props, { background: false }, ['background', 'scene', 'blur'])
  const texture = useEnvironment(rest)

  const store = useThree()
  createRenderEffect(() => {
    when(texture)((texture) => {
      const cleanup = setEnvProps(props.background, props.scene, store.scene, texture, props.blur)
      onCleanup(cleanup)
    })
  })
  return null
}

export function EnvironmentPortal(_props: EnvironmentProps) {
  const [props] = processProps(_props, {
    near: 1,
    far: 1000,
    resolution: 256,
    frames: 1,
    background: false,
  })
  const store = useThree()
  let camera: CubeCamera = null!
  const virtualScene = new Scene()
  const fbo = createMemo(() => {
    const fbo = new WebGLCubeRenderTarget(props.resolution)
    fbo.texture.type = HalfFloatType
    return fbo
  }, [props.resolution])

  createRenderEffect(() => {
    if (props.frames === 1) camera.update(store.gl, virtualScene)
    const cleanup = setEnvProps(props.background, props.scene, store.scene, fbo().texture, props.blur)
    onCleanup(cleanup)
  })

  let count = 1
  useFrame(() => {
    if (props.frames === Infinity || count < props.frames) {
      camera.update(store.gl, virtualScene)
      count++
    }
  })

  return (
    <>
      {createPortal(
        <>
          {props.children}
          {/* @ts-ignore */}
          <T.CubeCamera ref={camera} args={[props.near, props.far, fbo]} />
          {props.files || props.preset ? (
            <EnvironmentCube
              background
              files={props.files}
              preset={props.preset}
              path={props.path}
              extensions={props.extensions}
            />
          ) : props.map ? (
            <EnvironmentMap background map={props.map} extensions={props.extensions} />
          ) : null}
        </>,
        virtualScene
      )}
    </>
  )
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      GroundProjectedEnvImpl: Object3DNode<GroundProjectedEnvImpl>
    }
  }
}

function EnvironmentGround(props: EnvironmentProps) {
  const textureDefault = useEnvironment(props)
  const texture = () => props.map || textureDefault()

  extend({ GroundProjectedEnvImpl })

  const args = createMemo<[CubeTexture | Texture | undefined]>(() => [texture()])

  return (
    <>
      <EnvironmentMap {...props} map={texture()} />
      <Show when={args()[0]}>
        <T.GroundProjectedEnvImpl
          args={args()}
          scale={props.ground?.scale ?? 1000}
          height={props.ground?.height}
          radius={props.ground?.radius}
        />
      </Show>
    </>
  )
}

export function Environment(props: EnvironmentProps) {
  return props.ground ? (
    <EnvironmentGround {...props} />
  ) : props.map ? (
    <EnvironmentMap {...props} />
  ) : props.children ? (
    <EnvironmentPortal {...props} />
  ) : (
    <EnvironmentCube {...props} />
  )
}
