import { createPortal, Primitive } from '@solid-three/fiber'
import { createEffect, createSignal, JSX, on } from 'solid-js'
import * as THREE from 'three'
import { Flow } from 'three-stdlib'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'

export interface CurveModifierProps {
  children: JSX.Element
  curve?: THREE.Curve<THREE.Vector3>
}

export type CurveModifierRef = Pick<Flow, 'moveAlongCurve'>

export const CurveModifier: RefComponent<any, CurveModifierProps, true> = (props) => {
  const scene = new THREE.Scene()
  const [obj, set] = createSignal<THREE.Object3D>()
  let modifier: Flow

  createEffect(
    on(
      () => scene.children,
      () => {
        modifier = new Flow(scene.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>)
        set(modifier.object3D)
      }
    )
  )

  createEffect(() => {
    if (props.curve) modifier?.updateCurve(0, props.curve)
  })

  createImperativeHandle(props, () => ({
    moveAlongCurve: (val: number) => {
      modifier?.moveAlongCurve(val)
    },
  }))

  return (
    <>
      {createPortal(props.children, scene)}
      {obj() && <Primitive object={obj()!} />}
    </>
  )
}
