import { extend, SolidThreeFiber, T, ThreeProps, useFrame, useThree } from '@solid-three/fiber'
import { Accessor, createContext, createMemo, createRenderEffect, onCleanup, onMount, useContext } from 'solid-js'
import * as THREE from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'
import { DiscardMaterial } from '../materials/DiscardMaterial'
import { shaderMaterial } from './shaderMaterial'

function isLight(object: any): object is THREE.Light {
  return object.isLight
}

function isGeometry(object: any): object is THREE.Mesh {
  return !!object.geometry
}

export type AccumulativeShadowsProps = {
  /** How many frames it can render, more yields cleaner results but takes more time, 40 */
  frames?: number
  /** If frames === Infinity blend controls the refresh ratio, 100 */
  blend?: number
  /** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
  limit?: number
  /** Scale of the plane,  */
  scale?: number
  /** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
  temporal?: boolean
  /** Opacity of the plane, 1 */
  opacity?: number
  /** Discards alpha pixels, 0.65 */
  alphaTest?: number
  /** Shadow color, black */
  color?: string
  /** Colorblend, how much colors turn to black, 0 is black, 2 */
  colorBlend?: number
  /** Buffer resolution, 1024 */
  resolution?: number
  /** Texture tonemapping */
  toneMapped?: boolean
}

interface AccumulativeContext {
  lights: Map<any, any>
  temporal: boolean
  frames: number
  blend: number
  count: number
  /** Returns the plane geometry onto which the shadow is cast */
  getMesh: () => THREE.Mesh<THREE.PlaneGeometry, SoftShadowMaterialProps & THREE.ShaderMaterial>
  /** Resets the buffers, starting from scratch */
  reset: () => void
  /** Updates the lightmap for a number of frames accumulartively */
  update: (frames?: number) => void
}

interface AccumulativeLightContext {
  /** Jiggles the lights */
  update: () => void
}

type SoftShadowMaterialProps = {
  map: THREE.Texture
  color?: SolidThreeFiber.Color
  alphaTest?: number
  blend?: number
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      SoftShadowMaterial: ThreeProps<'ShaderMaterial'> & SoftShadowMaterialProps
    }
  }
}

export const accumulativeContext = createContext<AccumulativeContext>(null as unknown as AccumulativeContext)

const SoftShadowMaterial = shaderMaterial(
  {
    color: new THREE.Color(),
    blend: 2.0,
    alphaTest: 0.75,
    opacity: 0,
    map: null,
  },
  `varying vec2 vUv;
   void main() {
     gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
     vUv = uv;
   }`,
  `varying vec2 vUv;
   uniform sampler2D map;
   uniform vec3 color;
   uniform float opacity;
   uniform float alphaTest;
   uniform float blend;
   void main() {
     vec4 sampledDiffuseColor = texture2D(map, vUv);
     gl_FragColor = vec4(color * sampledDiffuseColor.r * blend, max(0.0, (1.0 - (sampledDiffuseColor.r + sampledDiffuseColor.g + sampledDiffuseColor.b) / alphaTest)) * opacity);
     #include <tonemapping_fragment>
     #include <encodings_fragment>
   }`
)

export const AccumulativeShadows: RefComponent<AccumulativeContext, ThreeProps<'Group'> & AccumulativeShadowsProps> = (
  _props
) => {
  const [props, rest] = processProps(
    _props,
    {
      frames: 40,
      limit: Infinity,
      blend: 20,
      scale: 10,
      opacity: 1,
      alphaTest: 0.75,
      color: 'black',
      colorBlend: 2,
      resolution: 1024,
      toneMapped: true,
    },
    [
      'ref',
      'children',
      'temporal',
      'frames',
      'limit',
      'blend',
      'scale',
      'opacity',
      'alphaTest',
      'color',
      'colorBlend',
      'resolution',
      'toneMapped',
    ]
  )

  extend({ SoftShadowMaterial })
  const store = useThree()
  let gPlane: THREE.Mesh<THREE.PlaneGeometry, SoftShadowMaterialProps & THREE.ShaderMaterial> = null!
  let gLights: THREE.Group = null!

  const plm = new ProgressiveLightMap(store.gl, store.scene, props.resolution)
  createRenderEffect(() => {
    plm.configure(gPlane)
  }, [])

  const api = createMemo<AccumulativeContext>(() => ({
    lights: new Map(),
    temporal: !!props.temporal,
    frames: Math.max(2, props.frames),
    blend: Math.max(2, props.frames === Infinity ? props.blend : props.frames),
    count: 0,
    getMesh: () => gPlane,
    reset: () => {
      if (!gPlane) return
      // Clear buffers, reset opacities, set frame count to 0
      plm.clear()
      const material = gPlane.material
      material.opacity = 0
      material.alphaTest = 0
      api().count = 0
    },
    update: (frames = 1) => {
      // Adapt the opacity-blend ratio to the number of frames
      const material = gPlane.material
      if (!api().temporal) {
        material.opacity = props.opacity
        material.alphaTest = props.alphaTest
      } else {
        material.opacity = Math.min(props.opacity, material.opacity + props.opacity / api().blend)
        material.alphaTest = Math.min(props.alphaTest, material.alphaTest + props.alphaTest / api().blend)
      }

      // Switch accumulative lights on
      gLights.visible = true
      // Collect scene lights and meshes
      plm.prepare()

      // Update the lightmap and the accumulative lights
      for (let i = 0; i < frames; i++) {
        api().lights.forEach((light) => light.update())
        plm.update(store.camera, api().blend)
      }
      // Switch lights off
      gLights.visible = false
      // Restore lights and meshes
      plm.finish()
    },
  }))

  onMount(() => {
    // Reset internals, buffers, ...
    api().reset()
    // Update lightmap
    if (!api().temporal && api().frames !== Infinity) api().update(api().blend)
  })

  // Expose api, allow children to set itself as the main light source
  createImperativeHandle(props, api)

  useFrame(() => {
    if ((api().temporal || api().frames === Infinity) && api().count < api().frames && api().count < props.limit) {
      store.invalidate()
      api().update()
      api().count++
    }
  })

  return (
    <T.Group {...rest}>
      <T.Group traverse={() => null} ref={gLights}>
        <accumulativeContext.Provider value={api()}>{props.children}</accumulativeContext.Provider>
      </T.Group>
      <T.Mesh receiveShadow ref={gPlane} scale={props.scale} rotation={[-Math.PI / 2, 0, 0]}>
        <T.PlaneGeometry />
        <T.SoftShadowMaterial
          transparent
          depthWrite={false}
          toneMapped={props.toneMapped}
          color={props.color}
          blend={props.colorBlend}
          map={plm.progressiveLightMap2.texture}
        />
      </T.Mesh>
    </T.Group>
  )
}

export type RandomizedLightProps = {
  /** How many frames it will jiggle the lights, 1.
   *  Frames is context aware, if a provider like AccumulativeShadows exists, frames will be taken from there!  */
  frames?: number
  /** Light position, [0, 0, 0] */
  position?: [x: number, y: number, z: number]
  /** Radius of the jiggle, higher values make softer light, 5 */
  radius?: number
  /** Amount of lights, 8 */
  amount?: number
  /** Light intensity, 1 */
  intensity?: number
  /** Ambient occlusion, lower values mean less AO, hight more, you can mix AO and directional light, 0.5 */
  ambient?: number
  /** If the lights cast shadows, this is true by default */
  castShadow?: boolean
  /** Default shadow bias, 0 */
  bias?: number
  /** Default map size, 512 */
  mapSize?: number
  /** Default size of the shadow camera, 10 */
  size?: number
  /** Default shadow camera near, 0.5 */
  near?: number
  /** Default shadow camera far, 500 */
  far?: number
}

export const RandomizedLight: RefComponent<AccumulativeLightContext, ThreeProps<'Group'> & RandomizedLightProps> = (
  _props
) => {
  const [props, rest] = processProps(
    _props,
    {
      castShadow: true,
      bias: 0.001,
      mapSize: 512,
      size: 5,
      near: 0.5,
      far: 500,
      frames: 1,
      position: [0, 0, 0],
      radius: 1,
      amount: 8,
      intensity: 1,
      ambient: 0.5,
    },
    [
      'ref',
      'castShadow',
      'bias',
      'mapSize',
      'size',
      'near',
      'far',
      'frames',
      'position',
      'radius',
      'amount',
      'intensity',
      'ambient',
    ]
  )

  let gLights: THREE.Group = null!
  const length = new THREE.Vector3(...props.position).length()
  // s3f:   should parent be reactive?
  const parent = useContext(accumulativeContext)

  const update = () => {
    let light: THREE.Object3D | undefined
    if (gLights) {
      for (let l = 0; l < gLights.children.length; l++) {
        light = gLights.children[l]
        if (Math.random() > props.ambient) {
          light.position.set(
            props.position[0] + THREE.MathUtils.randFloatSpread(props.radius),
            props.position[1] + THREE.MathUtils.randFloatSpread(props.radius),
            props.position[2] + THREE.MathUtils.randFloatSpread(props.radius)
          )
        } else {
          let lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0
          let phi = 2 * Math.PI * Math.random()
          light.position.set(
            Math.cos(lambda) * Math.cos(phi) * length,
            Math.abs(Math.cos(lambda) * Math.sin(phi) * length),
            Math.sin(lambda) * length
          )
        }
      }
    }
  }

  const api: Accessor<AccumulativeLightContext> = createMemo(() => ({ update }))
  createImperativeHandle(props, api)
  onMount(() => {
    const group = gLights
    if (parent) parent.lights.set(group.uuid, api())
    onCleanup(() => void parent.lights.delete(group.uuid))
  })

  return (
    <T.Group ref={gLights} {...rest}>
      {Array.from({ length: props.amount }, (_, index) => (
        <T.DirectionalLight
          castShadow={props.castShadow}
          shadow-bias={props.bias}
          shadow-mapSize={[props.mapSize, props.mapSize]}
          intensity={props.intensity / props.amount}
        >
          <T.OrthographicCamera
            attach="shadow-camera"
            args={[-props.size, props.size, props.size, -props.size, props.near, props.far]}
          />
        </T.DirectionalLight>
      ))}
    </T.Group>
  )
}

// Based on "Progressive Light Map Accumulator", by [zalo](https://github.com/zalo/)
class ProgressiveLightMap {
  renderer: THREE.WebGLRenderer
  res: number
  scene: THREE.Scene
  object: THREE.Mesh | null
  buffer1Active: boolean
  progressiveLightMap1: THREE.WebGLRenderTarget
  progressiveLightMap2: THREE.WebGLRenderTarget
  discardMat: THREE.ShaderMaterial
  targetMat: THREE.MeshLambertMaterial
  previousShadowMap: { value: THREE.Texture }
  averagingWindow: { value: number }
  clearColor: THREE.Color
  clearAlpha: number
  lights: { object: THREE.Light; intensity: number }[]
  meshes: { object: THREE.Mesh; material: THREE.Material | THREE.Material[] }[]

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, res: number = 1024) {
    this.renderer = renderer
    this.res = res
    this.scene = scene
    this.buffer1Active = false
    this.lights = []
    this.meshes = []
    this.object = null
    this.clearColor = new THREE.Color()
    this.clearAlpha = 0

    // Create the Progressive LightMap Texture
    const format = /(Android|iPad|iPhone|iPod)/g.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType
    this.progressiveLightMap1 = new THREE.WebGLRenderTarget(this.res, this.res, {
      type: format,
    })
    this.progressiveLightMap2 = new THREE.WebGLRenderTarget(this.res, this.res, {
      type: format,
    })

    // Inject some spicy new logic into a standard phong material
    this.discardMat = new DiscardMaterial()
    this.targetMat = new THREE.MeshLambertMaterial({ fog: false })
    this.previousShadowMap = { value: this.progressiveLightMap1.texture }
    this.averagingWindow = { value: 100 }
    this.targetMat.onBeforeCompile = (shader) => {
      // Vertex Shader: Set Vertex Positions to the Unwrapped UV Positions
      shader.vertexShader =
        'varying vec2 vUv;\n' +
        shader.vertexShader.slice(0, -1) +
        'vUv = uv; gl_Position = vec4((uv - 0.5) * 2.0, 1.0, 1.0); }'

      // Fragment Shader: Set Pixels to average in the Previous frame's Shadows
      const bodyStart = shader.fragmentShader.indexOf('void main() {')
      shader.fragmentShader =
        'varying vec2 vUv;\n' +
        shader.fragmentShader.slice(0, bodyStart) +
        'uniform sampler2D previousShadowMap;\n	uniform float averagingWindow;\n' +
        shader.fragmentShader.slice(bodyStart - 1, -1) +
        `\nvec3 texelOld = texture2D(previousShadowMap, vUv).rgb;
        gl_FragColor.rgb = mix(texelOld, gl_FragColor.rgb, 1.0/ averagingWindow);
      }`

      // Set the Previous Frame's Texture Buffer and Averaging Window
      shader.uniforms.previousShadowMap = this.previousShadowMap
      shader.uniforms.averagingWindow = this.averagingWindow
    }
  }

  clear() {
    this.renderer.getClearColor(this.clearColor)
    this.clearAlpha = this.renderer.getClearAlpha()
    this.renderer.setClearColor('black', 1)
    this.renderer.setRenderTarget(this.progressiveLightMap1)
    this.renderer.clear()
    this.renderer.setRenderTarget(this.progressiveLightMap2)
    this.renderer.clear()
    this.renderer.setRenderTarget(null)
    this.renderer.setClearColor(this.clearColor, this.clearAlpha)

    this.lights = []
    this.meshes = []
    this.scene.traverse((object) => {
      if (isGeometry(object)) {
        this.meshes.push({ object, material: object.material })
      } else if (isLight(object)) {
        this.lights.push({ object, intensity: object.intensity })
      }
    })
  }

  prepare() {
    this.lights.forEach((light) => (light.object.intensity = 0))
    this.meshes.forEach((mesh) => (mesh.object.material = this.discardMat))
  }

  finish() {
    this.lights.forEach((light) => (light.object.intensity = light.intensity))
    this.meshes.forEach((mesh) => (mesh.object.material = mesh.material))
  }

  configure(object) {
    this.object = object
  }

  update(camera, blendWindow = 100) {
    if (!this.object) return
    // Set each object's material to the UV Unwrapped Surface Mapping Version
    this.averagingWindow.value = blendWindow
    this.object.material = this.targetMat
    // Ping-pong two surface buffers for reading/writing
    const activeMap = this.buffer1Active ? this.progressiveLightMap1 : this.progressiveLightMap2
    const inactiveMap = this.buffer1Active ? this.progressiveLightMap2 : this.progressiveLightMap1
    // Render the object's surface maps
    const oldBg = this.scene.background
    this.scene.background = null
    this.renderer.setRenderTarget(activeMap)
    this.previousShadowMap.value = inactiveMap.texture
    this.buffer1Active = !this.buffer1Active
    this.renderer.render(this.scene, camera)
    this.renderer.setRenderTarget(null)
    this.scene.background = oldBg
  }
}
