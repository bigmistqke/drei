import { SolidThreeFiber, T, ThreeProps, extend, useFrame } from '@solid-three/fiber'
import { Show, createContext, createEffect, createSignal, splitProps, useContext } from 'solid-js'
import * as THREE from 'three'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { when } from '../helpers/when'

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      PositionPoint: SolidThreeFiber.Object3DNode<PositionPoint>
    }
  }
}

type Api = {
  getParent: () => THREE.Points
  subscribe: (ref) => void
}

type PointsInstancesProps = ThreeProps<'Points'> & {
  range?: number
  limit?: number
}

const _inverseMatrix = /*@__PURE__*/ new THREE.Matrix4()
const _ray = /*@__PURE__*/ new THREE.Ray()
const _sphere = /*@__PURE__*/ new THREE.Sphere()
const _position = /*@__PURE__*/ new THREE.Vector3()

export class PositionPoint extends THREE.Group {
  size: number
  color: THREE.Color
  instance: THREE.Points | undefined
  instanceKey: Parameters<typeof T.PositionPoint> | undefined
  constructor() {
    super()
    this.size = 0
    this.color = new THREE.Color('white')
    this.instance = undefined
    this.instanceKey = undefined
  }

  // This will allow the virtual instance have bounds
  get geometry() {
    return this.instance?.geometry
  }

  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
    const parent = this.instance
    if (!parent || !parent.geometry) return
    const instanceId = parent.userData.instances.indexOf(this.instanceKey)
    // If the instance wasn't found or exceeds the parents draw range, bail out
    if (instanceId === -1 || instanceId > parent.geometry.drawRange.count) return

    const threshold = raycaster.params.Points?.threshold ?? 1
    _sphere.set(this.getWorldPosition(_position), threshold)
    if (raycaster.ray.intersectsSphere(_sphere) === false) return

    _inverseMatrix.copy(parent.matrixWorld).invert()
    _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix)

    const localThreshold = threshold / ((this.scale.x + this.scale.y + this.scale.z) / 3)
    const localThresholdSq = localThreshold * localThreshold
    const rayPointDistanceSq = _ray.distanceSqToPoint(this.position)

    if (rayPointDistanceSq < localThresholdSq) {
      const intersectPoint = new THREE.Vector3()
      _ray.closestPointToPoint(this.position, intersectPoint)
      intersectPoint.applyMatrix4(this.matrixWorld)
      const distance = raycaster.ray.origin.distanceTo(intersectPoint)
      if (distance < raycaster.near || distance > raycaster.far) return
      intersects.push({
        distance: distance,
        distanceToRay: Math.sqrt(rayPointDistanceSq),
        point: intersectPoint,
        index: instanceId,
        face: null,
        object: this,
      })
    }
  }
}

let i, positionRef
const context = /*@__PURE__*/ createContext<Api>(null!)
const parentMatrix = /*@__PURE__*/ new THREE.Matrix4()
const position = /*@__PURE__*/ new THREE.Vector3()

/**
 * Instance implementation, relies on react + context to update the attributes based on the children of this component
 */
const PointsInstances: RefComponent<THREE.Points, PointsInstancesProps> = (_props) => {
  const [props, rest] = processProps(_props, { limit: 1000 }, ['ref', 'children', 'range', 'limit'])

  let [parent, setParent] = createSignal<THREE.Points>(null as unknown as THREE.Points)
  const [refs, setRefs] = createSignal<PositionPoint[]>([])
  const [positions, colors, sizes] = [
    new Float32Array(props.limit * 3),
    Float32Array.from({ length: props.limit * 3 }, () => 1),
    Float32Array.from({ length: props.limit }, () => 1),
  ]

  createEffect(() => {
    // We might be a frame too late? 🤷‍♂️
    when(parent)((parent) => {
      parent.geometry.attributes.position.needsUpdate = true
    })
  })

  useFrame(() => {
    when(parent)((parent) => {
      parent.updateMatrix()
      parent.updateMatrixWorld()
      parentMatrix.copy(parent.matrixWorld).invert()

      parent.geometry.drawRange.count = Math.min(
        props.limit,
        props.range !== undefined ? props.range : props.limit,
        refs().length
      )

      for (i = 0; i < refs().length; i++) {
        positionRef = refs()[i]
        positionRef.getWorldPosition(position).applyMatrix4(parentMatrix)
        position.toArray(positions, i * 3)
        parent.geometry.attributes.position.needsUpdate = true
        positionRef.matrixWorldNeedsUpdate = true
        positionRef.color.toArray(colors, i * 3)
        parent.geometry.attributes.color.needsUpdate = true
        sizes.set([positionRef.size], i)
        parent.geometry.attributes.size.needsUpdate = true
      }
    })
  })

  const api: Api = {
    getParent: parent,
    subscribe: (ref) => {
      setRefs((refs) => [...refs, ref])
      return () => setRefs((refs) => refs.filter((item) => item !== ref))
    },
  }

  return (
    <T.Points
      ref={mergeRefs(props, setParent)}
      userData={{
        get instances() {
          return refs()
        },
      }}
      matrixAutoUpdate={false}
      raycast={() => null}
      {...rest}
    >
      <T.BufferGeometry>
        <T.BufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
        <T.BufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
        <T.BufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
          usage={THREE.DynamicDrawUsage}
        />
      </T.BufferGeometry>
      <context.Provider value={api}>{props.children}</context.Provider>
    </T.Points>
  )
}

export const Point: RefComponent<unknown, ThreeProps<'PositionPoint'>> = (_props) => {
  const [props, rest] = splitProps(_props, ['ref', 'children'])
  extend({ PositionPoint })
  const group = createRef<unknown>()
  const api = useContext(context)
  createEffect(() => api?.subscribe(group.ref))
  return (
    <Show when={api?.getParent()}>
      {(parent) => (
        <T.PositionPoint instance={parent()} ref={mergeRefs(props, group)} instanceKey={group.ref} {...rest}>
          {props.children}
        </T.PositionPoint>
      )}
    </Show>
  )
}

/**
 * Buffer implementation, relies on complete buffers of the correct number, leaves it to the user to update them
 */
type PointsBuffersProps = ThreeProps<'Points'> & {
  // a buffer containing all points position
  positions: Float32Array
  colors?: Float32Array
  sizes?: Float32Array
  // The size of the points in the buffer
  stride?: 2 | 3
}

export const PointsBuffer: RefComponent<THREE.Points, PointsBuffersProps> = (_props) => {
  const [props, rest] = processProps(_props, { stride: 3 }, [
    'ref',
    'children',
    'positions',
    'colors',
    'sizes',
    'stride',
  ])

  const pointsRef = createRef<THREE.Points>()

  useFrame(() => {
    if (!pointsRef.ref) return
    const attr = pointsRef.ref.geometry.attributes
    if (!attr || !attr.position) {
      return
    }
    attr.position.needsUpdate = true
    if (props.colors) attr.color.needsUpdate = true
    if (props.sizes) attr.size.needsUpdate = true
  })

  return (
    <T.Points ref={mergeRefs(props, pointsRef!)} {...rest}>
      <T.BufferGeometry>
        <T.BufferAttribute
          attach="attributes-position"
          count={props.positions.length / props.stride}
          array={props.positions}
          itemSize={props.stride}
          usage={THREE.DynamicDrawUsage}
        />
        <Show when={props.colors}>
          <T.BufferAttribute
            attach="attributes-color"
            count={props.colors!.length / props.stride}
            array={props.colors}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </Show>
        <Show when={props.sizes}>
          <T.BufferAttribute
            attach="attributes-size"
            count={props.sizes!.length / props.stride}
            array={props.sizes}
            itemSize={1}
            usage={THREE.DynamicDrawUsage}
          />
        </Show>
      </T.BufferGeometry>
      {props.children}
    </T.Points>
  )
}

export const Points: RefComponent<THREE.Points, PointsBuffersProps | PointsInstancesProps> = (props) => {
  if ((props as PointsBuffersProps).positions instanceof Float32Array) {
    return <PointsBuffer {...(props as PointsBuffersProps)} />
  } else return <PointsInstances {...(props as PointsInstancesProps)} />
}
