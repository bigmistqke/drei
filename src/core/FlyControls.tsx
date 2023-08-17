import { Primitive, SolidThreeFiber, useFrame, useThree } from '@solid-three/fiber'
import { createEffect, createMemo, onCleanup, splitProps, untrack } from 'solid-js'
import * as THREE from 'three'
import { FlyControls as FlyControlsImpl } from 'three-stdlib'
import { RefComponent } from '../helpers/typeHelpers'

export type FlyControlsProps = SolidThreeFiber.Object3DNode<FlyControlsImpl> & {
  onChange?: (e?: THREE.Event) => void
  domElement?: HTMLElement
  makeDefault?: boolean
}

export const FlyControls: RefComponent<FlyControlsImpl, FlyControlsProps> = (props) => {
  const [rest] = splitProps(props, ['domElement', 'onChange', 'makeDefault'])
  const store = useThree()
  const explDomElement = () => (props.domElement || store.events.connected || store.gl.domElement) as HTMLElement
  const controls = createMemo(() => new FlyControlsImpl(store.camera, explDomElement()))

  createEffect(() => {
    controls().connect(explDomElement())
    onCleanup(() => void controls().dispose())
  })

  createEffect(() => {
    const callback = (e: THREE.Event) => {
      store.invalidate()
      if (props.onChange) props.onChange(e)
    }

    controls().addEventListener?.('change', callback)
    onCleanup(() => controls().removeEventListener?.('change', callback))
  })

  createEffect(() => {
    if (props.makeDefault) {
      const old = untrack(() => store.controls)
      store.set({ controls: controls() })
      onCleanup(() => store.set({ controls: old }))
    }
  })
  useFrame((_, delta) => controls().update(delta))
  return <Primitive ref={props.ref} object={controls()} {...rest} />
}
