import { T, ThreeProps } from '@solid-three/fiber'
import { createRenderEffect, createSignal, splitProps, type JSX } from 'solid-js'
import * as THREE from 'three'
import { capitalize } from '../helpers/capitalize'
import { mergeRefs } from '../helpers/mergeRefs'
import { createImperativeHandle } from '../helpers/useImperativeHandle'
import { when } from '../helpers/when'

export type Args<T> = T extends new (...args: any) => any ? ConstructorParameters<T> : T
export type ShapeProps<T> = Omit<ThreeProps<'Mesh'>, 'children' | 'args'> & {
  args?: Args<T>
  children?: JSX.Element | JSX.Element[]
}

function create<T>(type: string, effect?: (mesh: THREE.Mesh) => void) {
  const El: string = capitalize(type) + 'Geometry'

  return (_props: ShapeProps<T>) => {
    const [props, rest] = splitProps(_props, ['args', 'children', 'ref'])
    const [ref, setRef] = createSignal<THREE.Mesh>()

    createImperativeHandle(props, ref)
    createRenderEffect(() => when(ref)((ref) => effect?.(ref)))

    const Component = T[El]

    return (
      <T.Mesh ref={mergeRefs(setRef, props)} {...rest}>
        <Component attach="geometry" args={props.args} />
        {props.children}
      </T.Mesh>
    )
  }
}

export const Box = create<typeof THREE.BoxGeometry>('box')
export const Circle = create<typeof THREE.CircleGeometry>('circle')
export const Cone = create<typeof THREE.ConeGeometry>('cone')
export const Cylinder = create<typeof THREE.CylinderGeometry>('cylinder')
export const Sphere = create<typeof THREE.SphereGeometry>('sphere')
export const Plane = create<typeof THREE.PlaneGeometry>('plane')
export const Tube = create<typeof THREE.TubeGeometry>('tube')
export const Torus = create<typeof THREE.TorusGeometry>('torus')
export const TorusKnot = create<typeof THREE.TorusKnotGeometry>('torusKnot')
export const Tetrahedron = create<typeof THREE.TetrahedronGeometry>('tetrahedron')
export const Ring = create<typeof THREE.RingGeometry>('ring')
export const Polyhedron = create<typeof THREE.PolyhedronGeometry>('polyhedron')
export const Icosahedron = create<typeof THREE.IcosahedronGeometry>('icosahedron')
export const Octahedron = create<typeof THREE.OctahedronGeometry>('octahedron')
export const Dodecahedron = create<typeof THREE.DodecahedronGeometry>('dodecahedron')
export const Extrude = create<typeof THREE.ExtrudeGeometry>('extrude')
export const Lathe = create<typeof THREE.LatheGeometry>('lathe')
export const Capsule = create<typeof THREE.CapsuleGeometry>('capsule')
export const Shape = create<typeof THREE.ShapeGeometry>('shape', ({ geometry }) => {
  // Calculate UVs (by https://discourse.threejs.org/u/prisoner849)
  // https://discourse.threejs.org/t/custom-shape-in-image-not-working/49348/10
  const pos = geometry.attributes.position as THREE.BufferAttribute
  const b3 = new THREE.Box3().setFromBufferAttribute(pos)
  const b3size = new THREE.Vector3()
  b3.getSize(b3size)
  const uv: number[] = []
  let x = 0,
    y = 0,
    u = 0,
    v = 0
  for (let i = 0; i < pos.count; i++) {
    x = pos.getX(i)
    y = pos.getY(i)
    u = (x - b3.min.x) / b3size.x
    v = (y - b3.min.y) / b3size.y
    uv.push(u, v)
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
})
