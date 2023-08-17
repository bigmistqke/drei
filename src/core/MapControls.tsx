import { Primitive, SolidThreeFiber, useFrame, useThree } from '@solid-three/fiber'
import { createEffect, createMemo, onCleanup, splitProps, untrack } from 'solid-js'
import * as THREE from 'three'
import { MapControls as MapControlsImpl } from 'three-stdlib'
import { RefComponent } from '../helpers/typeHelpers'

export type MapControlsProps = SolidThreeFiber.Overwrite<
  SolidThreeFiber.Object3DNode<MapControlsImpl>,
  {
    target?: SolidThreeFiber.Vector3
    camera?: THREE.Camera
    makeDefault?: boolean
    onChange?: (e?: THREE.Event) => void
    onStart?: (e?: THREE.Event) => void
    onEnd?: (e?: THREE.Event) => void
    domElement?: HTMLElement
  }
>

export const MapControls: RefComponent<MapControlsImpl, MapControlsProps> = (props) => {
  const [rest] = splitProps(props, ['domElement', 'camera', 'makeDefault', 'onChange', 'onStart', 'onEnd'])
  const store = useThree()
  const explDomElement = () => (props.domElement || store.events.connected || store.gl.domElement) as HTMLElement

  const explCamera = () => (props.camera || store.camera) as THREE.OrthographicCamera | THREE.PerspectiveCamera
  const controls = createMemo(() => new MapControlsImpl(explCamera()))

  createEffect(() => {
    controls().connect(explDomElement())
    const callback = (e: THREE.Event) => {
      store.invalidate()
      if (props.onChange) props.onChange(e)
    }
    controls().addEventListener('change', callback)

    if (props.onStart) controls().addEventListener('start', props.onStart)
    if (props.onEnd) controls().addEventListener('end', props.onEnd)

    onCleanup(() => {
      controls().dispose()
      controls().removeEventListener('change', callback)
      if (props.onStart) controls().removeEventListener('start', props.onStart)
      if (props.onEnd) controls().removeEventListener('end', props.onEnd)
    })
  })

  createEffect(() => {
    if (props.makeDefault) {
      const old = untrack(() => store.controls)
      store.set({ controls: controls() })
      onCleanup(() => store.set({ controls: old }))
    }
  })

  useFrame(() => controls().update(), -1)
  return <Primitive ref={props.ref} object={controls()} enableDamping={props.enableDamping || true} {...rest} />
}
