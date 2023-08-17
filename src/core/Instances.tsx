import { SolidThreeFiber, T, ThreeProps, extend, useFrame } from '@solid-three/fiber'
import {
  Context,
  JSX,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  splitProps,
  useContext,
} from 'solid-js'
import * as THREE from 'three'
import Composer from '../helpers/composer'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      PositionMesh: SolidThreeFiber.Object3DNode<PositionMesh>
    }
  }
}

type Api = {
  getParent: () => InstancedMesh
  subscribe: <T>(ref: T) => void
}

export type InstancesProps = ThreeProps<'InstancedMesh'> & {
  range?: number
  limit?: number
  frames?: number
}

export type InstanceProps = ThreeProps<'PositionMesh'> & {
  context?: Context<Api | undefined>
}

type InstancedMesh = Omit<THREE.InstancedMesh, 'instanceMatrix' | 'instanceColor'> & {
  instanceMatrix: THREE.InstancedBufferAttribute
  instanceColor: THREE.InstancedBufferAttribute
}

const _instanceLocalMatrix = /*@__PURE__*/ new THREE.Matrix4()
const _instanceWorldMatrix = /*@__PURE__*/ new THREE.Matrix4()
const _instanceIntersects: THREE.Intersection[] = /*@__PURE__*/ []
const _mesh = /*@__PURE__*/ new THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>()

class PositionMesh extends THREE.Group {
  color: THREE.Color
  instance: THREE.InstancedMesh | undefined
  instanceKey: Parameters<typeof T.PositionMesh>[0] | undefined
  constructor() {
    super()
    this.color = new THREE.Color('white')
    this.instance = undefined
    this.instanceKey = undefined
  }

  // This will allow the virtual instance have bounds
  get geometry() {
    return this.instance?.geometry
  }

  // And this will allow the virtual instance to receive events
  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
    const parent = this.instance
    if (!parent) return
    if (!parent.geometry || !parent.material) return
    _mesh.geometry = parent.geometry
    const matrixWorld = parent.matrixWorld
    const instanceId = parent.userData.instances.indexOf(this.instanceKey)
    // If the instance wasn't found or exceeds the parents draw range, bail out
    if (instanceId === -1 || instanceId > parent.count) return
    // calculate the world matrix for each instance
    parent.getMatrixAt(instanceId, _instanceLocalMatrix)
    _instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix)
    // the mesh represents this single instance
    _mesh.matrixWorld = _instanceWorldMatrix
    // raycast side according to instance material
    if (parent.material instanceof THREE.Material) _mesh.material.side = parent.material.side
    else _mesh.material.side = parent.material[0].side
    _mesh.raycast(raycaster, _instanceIntersects)
    // process the result of raycast
    for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
      const intersect = _instanceIntersects[i]
      intersect.instanceId = instanceId
      intersect.object = this
      intersects.push(intersect)
    }
    _instanceIntersects.length = 0
  }
}

const globalContext = /*@__PURE__*/ createContext<Api>(null!)
const parentMatrix = /*@__PURE__*/ new THREE.Matrix4()
const instanceMatrix = /*@__PURE__*/ new THREE.Matrix4()
const tempMatrix = /*@__PURE__*/ new THREE.Matrix4()
const translation = /*@__PURE__*/ new THREE.Vector3()
const rotation = /*@__PURE__*/ new THREE.Quaternion()
const scale = /*@__PURE__*/ new THREE.Vector3()

export const Instance: RefComponent<any, InstanceProps, true> = (_props) => {
  const [props, rest] = splitProps(_props, ['context', 'ref', 'children'])

  createMemo(() => extend({ PositionMesh }), [])
  let group: ThreeProps<'PositionMesh'> | undefined
  const { subscribe, getParent } = useContext(props.context || globalContext)!
  // s3f:   this used to be a `createRenderEffect` but then group would be undefined
  onMount(() => subscribe(group))
  return (
    <T.PositionMesh instance={getParent()} instanceKey={group} ref={mergeRefs(props.ref, group)} {...props}>
      {props.children}
    </T.PositionMesh>
  )
}

export const Instances: RefComponent<THREE.InstancedMesh, InstancesProps, true> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      limit: 1000,
      frames: Infinity,
    },
    ['ref', 'children', 'range', 'limit', 'frames']
  )

  const { context, instance } = (() => {
    const context = createContext<Api>(null!)
    return {
      context,
      instance: ((props) => <Instance context={context} {...props} />) as RefComponent<PositionMesh, InstanceProps>,
    }
  })()

  const parentRef = createRef<InstancedMesh>(null!)
  const [instances, setInstances] = createSignal<PositionMesh[]>([])
  const [matrices, colors] = (() => {
    const mArray = new Float32Array(props.limit * 16)
    for (let i = 0; i < props.limit; i++) tempMatrix.identity().toArray(mArray, i * 16)
    return [mArray, new Float32Array([...new Array(props.limit * 3)].map(() => 1))]
  })()

  createEffect(() => {
    // We might be a frame too late? 🤷‍♂️
    parentRef.ref.instanceMatrix.needsUpdate = true
  })

  let count = 0
  let updateRange = 0
  useFrame(() => {
    if (props.frames === Infinity || count < props.frames) {
      parentRef.ref.updateMatrix()
      parentRef.ref.updateMatrixWorld()
      parentMatrix.copy(parentRef.ref.matrixWorld).invert()

      updateRange = Math.min(props.limit, props.range !== undefined ? props.range : props.limit, instances.length)
      parentRef.ref.count = updateRange
      parentRef.ref.instanceMatrix.updateRange.count = updateRange * 16
      parentRef.ref.instanceColor.updateRange.count = updateRange * 3

      for (let i = 0; i < instances.length; i++) {
        const instance = instances[i]
        // Multiply the inverse of the InstancedMesh world matrix or else
        // Instances will be double-transformed if <Instances> isn't at identity
        instance.matrixWorld.decompose(translation, rotation, scale)
        instanceMatrix.compose(translation, rotation, scale).premultiply(parentMatrix)
        instanceMatrix.toArray(matrices, i * 16)
        parentRef.ref.instanceMatrix.needsUpdate = true
        instance.color.toArray(colors, i * 3)
        parentRef.ref.instanceColor.needsUpdate = true
      }
      count++
    }
  })

  const api = createMemo(() => ({
    getParent: () => parentRef.ref,
    subscribe: (ref) => {
      setInstances((instances) => [...instances, ref])
      return () => setInstances((instances) => instances.filter((item) => item !== ref))
    },
  }))

  return (
    <T.InstancedMesh
      userData={{ instances }}
      matrixAutoUpdate={false}
      ref={mergeRefs(props, parentRef)}
      args={[null as any, null as any, 0]}
      raycast={() => null}
      {...rest}
    >
      <T.InstancedBufferAttribute
        attach="instanceMatrix"
        count={matrices.length / 16}
        array={matrices}
        itemSize={16}
        usage={THREE.DynamicDrawUsage}
      />
      <T.InstancedBufferAttribute
        attach="instanceColor"
        count={colors.length / 3}
        array={colors}
        itemSize={3}
        usage={THREE.DynamicDrawUsage}
      />
      {typeof props.children === 'function' ? (
        <context.Provider value={api()}>{props.children(instance)}</context.Provider>
      ) : (
        <globalContext.Provider value={api()}>{props.children}</globalContext.Provider>
      )}
    </T.InstancedMesh>
  )
}

export interface MergedProps extends InstancesProps {
  meshes: THREE.Mesh[]
  children: JSX.Element
}

export const Merged: RefComponent<THREE.Group, any> = function Merged(_props) {
  const [props, rest] = splitProps(_props, ['ref', 'meshes', 'children'])

  const isArray = Array.isArray(props.meshes)
  // Filter out meshes from collections, which may contain non-meshes
  if (!isArray) for (const key of Object.keys(props.meshes)) if (!props.meshes[key].isMesh) delete props.meshes[key]
  return (
    <T.Group ref={props.ref}>
      <Composer
        components={(isArray ? props.meshes : Object.values(props.meshes)).map(({ geometry, material }) => (
          <Instances key={geometry.uuid} geometry={geometry} material={material} {...rest} />
        ))}
      >
        {(args) =>
          isArray
            ? props.children(...args)
            : props.children(
                Object.keys(props.meshes)
                  .filter((key) => props.meshes[key].isMesh)
                  .reduce((acc, key, i) => ({ ...acc, [key]: args[i] }), {})
              )
        }
      </Composer>
    </T.Group>
  )
}
