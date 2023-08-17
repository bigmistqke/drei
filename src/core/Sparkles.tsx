import { Node, T, ThreeProps, extend, useFrame, useThree } from '@solid-three/fiber'
import { createMemo } from 'solid-js'
import * as THREE from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'
import { shaderMaterial } from './shaderMaterial'

export interface Props {
  /** Number of particles (default: 100) */
  count?: number
  /** Speed of particles (default: 1) */
  speed?: number | Float32Array
  /** Opacity of particles (default: 1) */
  opacity?: number | Float32Array
  /** Color of particles (default: 100) */
  color?: THREE.ColorRepresentation | Float32Array
  /** Size of particles (default: randomized between 0 and 1) */
  size?: number | Float32Array
  /** The space the particles occupy (default: 1) */
  scale?: number | [number, number, number] | THREE.Vector3
  /** Movement factor (default: 1) */
  noise?: number | [number, number, number] | THREE.Vector3 | Float32Array
}

const SparklesImplMaterial = shaderMaterial(
  { time: 0, pixelRatio: 1 },
  ` uniform float pixelRatio;
    uniform float time;
    attribute float size;  
    attribute float speed;  
    attribute float opacity;
    attribute vec3 noise;
    attribute vec3 color;
    varying vec3 vColor;
    varying float vOpacity;
    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
      modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
      modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectionPostion = projectionMatrix * viewPosition;
      gl_Position = projectionPostion;
      gl_PointSize = size * 25. * pixelRatio;
      gl_PointSize *= (1.0 / - viewPosition.z);
      vColor = color;
      vOpacity = opacity;
    }`,
  ` varying vec3 vColor;
    varying float vOpacity;
    void main() {
      float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
      float strength = 0.05 / distanceToCenter - 0.1;
      gl_FragColor = vec4(vColor, strength * vOpacity);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`
)

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      SparklesImplMaterial: Node<any, any>
    }
  }
}

const isFloat32Array = (def: any): def is Float32Array => def && (def as Float32Array).constructor === Float32Array

const expandColor = (v: THREE.Color) => [v.r, v.g, v.b]
const isVector = (v: any): v is THREE.Vector2 | THREE.Vector3 | THREE.Vector4 =>
  v instanceof THREE.Vector2 || v instanceof THREE.Vector3 || v instanceof THREE.Vector4

const normalizeVector = (v: any): number[] => {
  if (Array.isArray(v)) return v
  else if (isVector(v)) return v.toArray()
  return [v, v, v] as number[]
}

function usePropAsIsOrAsAttribute<T extends any>(
  count: number,
  prop?: T | Float32Array,
  setDefault?: (v: T) => number
) {
  return createMemo(() => {
    if (prop !== undefined) {
      if (isFloat32Array(prop)) {
        return prop as Float32Array
      } else {
        if (prop instanceof THREE.Color) {
          const a = Array.from({ length: count * 3 }, () => expandColor(prop)).flat()
          return Float32Array.from(a)
        } else if (isVector(prop) || Array.isArray(prop)) {
          const a = Array.from({ length: count * 3 }, () => normalizeVector(prop)).flat()
          return Float32Array.from(a)
        }
        return Float32Array.from({ length: count }, () => prop as number)
      }
    }
    return Float32Array.from({ length: count }, setDefault!)
  })
}

extend({ SparklesImplMaterial })

export const Sparkles: RefComponent<THREE.Points, Props & ThreeProps<'Points'>> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      noise: 1,
      count: 100,
      speed: 1,
      opacity: 1,
      scale: 1,
    },
    ['ref', 'noise', 'count', 'speed', 'opacity', 'scale', 'size', 'color', 'children']
  )

  let ref: THREE.Points = null!
  const store = useThree()

  const _scale = normalizeVector(props.scale)
  const positions = createMemo(
    () =>
      Float32Array.from(Array.from({ length: props.count }, () => _scale.map(THREE.MathUtils.randFloatSpread)).flat()),
    [props.count, ..._scale]
  )

  const sizes = usePropAsIsOrAsAttribute<number>(props.count, props.size, Math.random)
  const opacities = usePropAsIsOrAsAttribute<number>(props.count, props.opacity)
  const speeds = usePropAsIsOrAsAttribute<number>(props.count, props.speed)
  const noises = usePropAsIsOrAsAttribute<typeof props.noise>(props.count * 3, props.noise)
  const colors = usePropAsIsOrAsAttribute<THREE.ColorRepresentation>(
    props.color === undefined ? props.count * 3 : props.count,
    !isFloat32Array(props.color) ? new THREE.Color(props.color) : props.color,
    () => 1
  )

  useFrame((state) => {
    if (ref && ref.material) (ref.material as any).time = state.clock.elapsedTime
  })

  createImperativeHandle(props, () => ref)

  return (
    <T.Points key={`particle-${props.count}-${JSON.stringify(props.scale)}`} {...rest} ref={ref}>
      <T.BufferGeometry>
        <T.BufferAttribute attach="attributes-position" args={[positions(), 3]} />
        <T.BufferAttribute attach="attributes-size" args={[sizes(), 1]} />
        <T.BufferAttribute attach="attributes-opacity" args={[opacities(), 1]} />
        <T.BufferAttribute attach="attributes-speed" args={[speeds(), 1]} />
        <T.BufferAttribute attach="attributes-color" args={[colors(), 3]} />
        <T.BufferAttribute attach="attributes-noise" args={[noises(), 3]} />
      </T.BufferGeometry>
      {props.children ? (
        props.children
      ) : (
        <T.SparklesImplMaterial transparent pixelRatio={store.viewport.dpr} depthWrite={false} />
      )}
    </T.Points>
  )
}
