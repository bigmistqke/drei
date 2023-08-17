import * as FIBER from '@solid-three/fiber'
import { T, ThreeProps, applyProps } from '@solid-three/fiber'
import { Accessor, JSX, Show, createEffect, onCleanup } from 'solid-js'
import * as THREE from 'three'
import { DecalGeometry } from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'

export type DecalProps = Omit<ThreeProps<'Mesh'>, 'children'> & {
  debug?: boolean
  mesh?: Accessor<THREE.Mesh>
  position?: FIBER.Vector3
  rotation?: FIBER.Euler | number
  scale?: FIBER.Vector3
  map?: THREE.Texture
  children?: JSX.Element
  polygonOffsetFactor?: number
  depthTest?: boolean
}

function isArray(vec: any): vec is number[] {
  return Array.isArray(vec)
}

function vecToArray(vec: number[] | FIBER.Vector3 | FIBER.Euler | number = [0, 0, 0]) {
  if (isArray(vec)) {
    return vec
  } else if (vec instanceof THREE.Vector3 || vec instanceof THREE.Euler) {
    return [vec.x, vec.y, vec.z]
  } else {
    return [vec, vec, vec]
  }
}

export const Decal: RefComponent<THREE.Mesh, DecalProps> = function Decal(_props) {
  const [props, rest] = processProps(
    _props,
    {
      depthTest: false,
      polygonOffsetFactor: -1,
    },
    ['ref', 'debug', 'depthTest', 'polygonOffsetFactor', 'map', 'mesh', 'children', 'position', 'rotation', 'scale']
  )

  let ref: THREE.Mesh = null!
  createImperativeHandle(props, () => ref)
  let helper: THREE.Mesh = null!

  createEffect(() => {
    const parent = props.mesh || ref.parent
    if (!(parent instanceof THREE.Mesh)) {
      throw new Error('Decal must have a Mesh as parent or specify its "mesh" prop')
    }

    const state = {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1),
    }

    if (parent && ref) {
      applyProps(state, { position: props.position, scale: props.scale })

      // Zero out the parents matrix world for this operation
      const matrixWorld = parent.matrixWorld.clone()
      parent.matrixWorld.identity()

      /* if (!props.rotation || typeof props.rotation === 'number') {
        const o = new THREE.Object3D()

        o.position.copy(state.position)
        o.lookAt(parent.position)
        if (typeof props.rotation === 'number') o.rotateZ(props.rotation)
        applyProps(state as any, { rotation: o.rotation })
      } else {
        applyProps(state as any, { rotation: props.rotation })
      } */

      ref.geometry = new DecalGeometry(parent, state.position, state.rotation, state.scale)
      if (helper) {
        applyProps(helper as any, state)
        // Prevent the helpers from blocking rays
        helper.traverse((child) => (child.raycast = () => null))
      }
      // Reset parents matix-world
      parent.matrixWorld = matrixWorld
      onCleanup(() => ref.geometry.dispose())
    }
  })

  // <T.MeshStandardMaterial transparent polygonOffset polygonOffsetFactor={-10} {...props} />}
  return (
    <T.Mesh
      ref={ref}
      material-transparent
      material-polygonOffset
      material-polygonOffsetFactor={props.polygonOffsetFactor}
      material-depthTest={props.depthTest}
      material-map={props.map}
      {...rest}
    >
      {props.children}
      <Show when={props.debug}>
        <T.Mesh ref={helper}>
          <T.BoxGeometry />
          <T.MeshNormalMaterial wireframe />
          <T.AxesHelper />
        </T.Mesh>
      </Show>
    </T.Mesh>
  )
}
