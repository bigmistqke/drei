// SpotLight Inspired by http://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html

import { Primitive, T, ThreeProps, useFrame, useThree } from '@solid-three/fiber'
import {
  ParentProps,
  createContext,
  createEffect,
  createMemo,
  createRenderEffect,
  on,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js'
import {
  CylinderGeometry,
  DepthTexture,
  DoubleSide,
  LinearEncoding,
  Matrix4,
  Mesh,
  Object3D,
  RGBAFormat,
  RepeatWrapping,
  ShaderMaterial,
  SpotLight as SpotLightImpl,
  Texture,
  Vector3,
  WebGLRenderTarget,
} from 'three'
import { FullScreenQuad } from 'three-stdlib'
import { mergeRefs } from '../helpers/mergeRefs'
import { SpotLightMaterial } from '../materials/SpotLightMaterial'

// eslint-disable-next-line
// @ts-ignore
import { createRef } from '../helpers/createRef'
import SpotlightShadowShader from '../helpers/glsl/DefaultSpotlightShadowShadows.glsl'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

type SpotLightProps = ThreeProps<'SpotLight'> & {
  depthBuffer?: DepthTexture
  attenuation?: number
  anglePower?: number
  radiusTop?: number
  radiusBottom?: number
  opacity?: number
  color?: string | number
  volumetric?: boolean
  debug?: boolean
}

const isSpotLight = (child: Object3D | null): child is SpotLightImpl => {
  return (child as SpotLightImpl)?.isSpotLight
}

function VolumetricMesh(_props: Omit<SpotLightProps, 'volumetric'>) {
  const [props] = processProps(_props, {
    opacity: 1,
    color: 'white',
    distance: 5,
    angle: 0.15,
    attenuation: 5,
    anglePower: 5,
  })

  let mesh: Mesh = null!
  const store = useThree()
  const material = new SpotLightMaterial()
  const vec = new Vector3()

  let radiusTop = () => (props.radiusTop === undefined ? 0.1 : props.radiusTop)
  let radiusBottom = () => (props.radiusBottom === undefined ? props.angle * 7 : props.radiusBottom)

  useFrame(() => {
    material.uniforms.spotPosition.value.copy(mesh.getWorldPosition(vec))
    mesh.lookAt((mesh.parent as any).target.getWorldPosition(vec))
  })

  const geom = createMemo(() => {
    const geometry = new CylinderGeometry(radiusTop(), radiusBottom(), props.distance, 128, 64, true)
    geometry.applyMatrix4(new Matrix4().makeTranslation(0, -props.distance / 2, 0))
    geometry.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2))
    return geometry
  })

  return (
    <>
      <T.Mesh ref={mesh} geometry={geom()} raycast={() => null}>
        <Primitive
          object={material}
          attach="material"
          uniforms-opacity-value={props.opacity}
          uniforms-lightColor-value={props.color}
          uniforms-attenuation-value={props.attenuation}
          uniforms-anglePower-value={props.anglePower}
          uniforms-depth-value={props.depthBuffer}
          uniforms-cameraNear-value={store.camera.near}
          uniforms-cameraFar-value={store.camera.far}
          uniforms-resolution-value={
            props.depthBuffer ? [store.size.width * store.viewport.dpr, store.size.height * store.viewport.dpr] : [0, 0]
          }
        />
      </T.Mesh>
    </>
  )
}

function useCommon(arg: { spotlight: SpotLightImpl; mesh: Mesh; width: number; height: number; distance: number }) {
  const [pos, dir] = [new Vector3(), new Vector3()]

  createRenderEffect(() => {
    if (isSpotLight(arg.spotlight)) {
      arg.spotlight.shadow.mapSize.set(arg.width, arg.height)
      arg.spotlight.shadow.needsUpdate = true
    } else {
      throw new Error('SpotlightShadow must be a child of a SpotLight')
    }
  })

  useFrame(() => {
    if (!arg.mesh) return

    const A = arg.spotlight.position
    const B = arg.spotlight.target.position

    dir.copy(B).sub(A)
    var len = dir.length()
    dir.normalize().multiplyScalar(len * arg.distance)
    pos.copy(A).add(dir)

    arg.mesh.position.copy(pos)
    arg.mesh.lookAt(arg.spotlight.target.position)
  })
}

interface ShadowMeshProps {
  distance?: number
  alphaTest?: number
  scale?: number
  map?: Texture
  shader?: string
  width?: number
  height?: number
}

function SpotlightShadowWithShader(
  _props: ParentProps<ShadowMeshProps> & { spotlight: SpotLightImpl; debug: boolean }
) {
  const [props, rest] = processProps(
    _props,
    {
      distance: 0.4,
      alphaTest: 0.5,
      shader: SpotlightShadowShader,
      width: 512,
      height: 512,
      scale: 1,
    },
    ['distance', 'alphaTest', 'map', 'shader', 'width', 'height', 'scale', 'children']
  )

  let mesh: Mesh = null!

  onMount(() =>
    useCommon({
      mesh,
      get spotlight() {
        return rest.spotlight
      },
      get width() {
        return props.width
      },
      get height() {
        return props.height
      },
      get distance() {
        return props.distance
      },
    })
  )

  const renderTarget = createMemo(
    () =>
      new WebGLRenderTarget(props.width, props.height, {
        format: RGBAFormat,
        encoding: LinearEncoding,
        stencilBuffer: false,
        // depthTexture: null!
      })
  )

  let uniforms = {
    uShadowMap: {
      value: props.map,
    },
    uTime: {
      value: 0,
    },
  }

  createEffect(() => void (uniforms.uShadowMap.value = props.map))

  const fsQuad = createMemo(
    () =>
      new FullScreenQuad(
        new ShaderMaterial({
          uniforms: uniforms,
          vertexShader: /* glsl */ `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
          `,
          fragmentShader: props.shader,
        })
      ),
    [props.shader]
  )

  createEffect(
    on(fsQuad, (fsQuad) =>
      onCleanup(() => {
        fsQuad.material.dispose()
        fsQuad.dispose()
      })
    )
  )

  createEffect(on(renderTarget, (renderTarget) => onCleanup(() => renderTarget.dispose())))

  useFrame(({ gl }, dt) => {
    uniforms.uTime.value += dt

    gl.setRenderTarget(renderTarget())
    fsQuad().render(gl)
    gl.setRenderTarget(null)
  })

  return (
    <>
      <T.Mesh ref={mesh} scale={props.scale} castShadow>
        <T.PlaneGeometry />
        <T.MeshBasicMaterial
          transparent
          side={DoubleSide}
          alphaTest={props.alphaTest}
          alphaMap={renderTarget().texture}
          alphaMap-wrapS={RepeatWrapping}
          alphaMap-wrapT={RepeatWrapping}
          opacity={rest.debug ? 1 : 0}
        >
          {props.children}
        </T.MeshBasicMaterial>
      </T.Mesh>
    </>
  )
}

function SpotlightShadowWithoutShader(
  _props: ParentProps<ShadowMeshProps> & { spotlight: SpotLightImpl; debug: boolean }
) {
  const [props, rest] = processProps(
    _props,
    {
      distance: 0.4,
      alphaTest: 0.5,
      width: 512,
      height: 512,
    },
    ['distance', 'alphaTest', 'map', 'width', 'height', 'scale', 'children']
  )

  let mesh: Mesh = null!

  onMount(() =>
    useCommon({
      mesh,
      get spotlight() {
        return rest.spotlight
      },
      get width() {
        return props.width
      },
      get height() {
        return props.height
      },
      get distance() {
        return props.distance
      },
    })
  )

  return (
    <>
      <T.Mesh ref={mesh} scale={props.scale} castShadow>
        <T.PlaneGeometry />
        <T.MeshBasicMaterial
          transparent
          side={DoubleSide}
          alphaTest={props.alphaTest}
          alphaMap={props.map}
          alphaMap-wrapS={RepeatWrapping}
          alphaMap-wrapT={RepeatWrapping}
          opacity={rest.debug ? 1 : 0}
        >
          {props.children}
        </T.MeshBasicMaterial>
      </T.Mesh>
    </>
  )
}

export function SpotLightShadow(props: ParentProps<ShadowMeshProps>) {
  const context = useSpotLightContext()
  if (!context) {
    throw 'SpotLightShadow should be sibling of SpotLight'
  }
  if (props.shader) return <SpotlightShadowWithShader {...props} {...context} />
  return <SpotlightShadowWithoutShader {...props} {...context} />
}

const spotLightContext = createContext<{ spotlight: SpotLightImpl; debug: boolean }>()
const useSpotLightContext = () => useContext(spotLightContext)

const SpotLight: RefComponent<SpotLightImpl, SpotLightProps> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      opacity: 1,
      color: 'white',
      distance: 5,
      angle: 0.15,
      attenuation: 5,
      anglePower: 5,
      volumetric: true,
      debug: false,
    },
    [
      'ref',
      'opacity',
      'radiusTop',
      'radiusBottom',
      'depthBuffer',
      'color',
      'distance',
      'angle',
      'attenuation',
      'anglePower',
      'volumetric',
      'debug',
      'children',
    ]
  )

  // const [spotlight, setSpotlight] = createSignal<SpotLightImpl>(null!)
  let spotlight = createRef<SpotLightImpl>(null!)
  return (
    <T.Group>
      <T.SpotLight
        ref={mergeRefs(props, spotlight)}
        angle={props.angle}
        color={props.color}
        distance={props.distance}
        castShadow
        {...rest}
      >
        {props.volumetric && (
          <VolumetricMesh
            debug={props.debug}
            opacity={props.opacity}
            radiusTop={props.radiusTop}
            radiusBottom={props.radiusBottom}
            depthBuffer={props.depthBuffer}
            color={props.color}
            distance={props.distance}
            angle={props.angle}
            attenuation={props.attenuation}
            anglePower={props.anglePower}
          />
        )}
      </T.SpotLight>
      <spotLightContext.Provider
        value={{
          spotlight: spotlight.ref!,
          get debug() {
            return props.debug
          },
        }}
      >
        {props.children}
      </spotLightContext.Provider>
      <T.SpotLightHelper args={[spotlight.ref]} />
    </T.Group>
  )
}

export { SpotLight }
