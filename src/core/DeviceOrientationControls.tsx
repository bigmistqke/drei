import { Primitive, SolidThreeFiber, useFrame, useThree } from '@solid-three/fiber'
import { createEffect, onCleanup, splitProps } from 'solid-js'
import * as THREE from 'three'
import { DeviceOrientationControls as DeviceOrientationControlsImp } from 'three-stdlib'
import { RefComponent } from '../helpers/typeHelpers'

export type DeviceOrientationControlsProps = Omit<
  SolidThreeFiber.Object3DNode<DeviceOrientationControlsImp>,
  'object'
> & {
  camera?: THREE.Camera
  onChange?: (e?: THREE.Event) => void
  makeDefault?: boolean
}

export const DeviceOrientationControls: RefComponent<DeviceOrientationControlsImp, DeviceOrientationControlsProps> = (
  _props: DeviceOrientationControlsProps
) => {
  const [props, rest] = splitProps(_props, ['ref', 'camera', 'onChange', 'makeDefault'])
  const store = useThree()

  const explCamera = props.camera || store.camera
  const controls = new DeviceOrientationControlsImp(explCamera)

  createEffect(() => {
    const callback = (e: THREE.Event) => {
      store.invalidate()
      if (props.onChange) props.onChange(e)
    }
    controls.addEventListener?.('change', callback)
    onCleanup(() => controls.removeEventListener?.('change', callback))
  })

  useFrame(() => controls.update(), -1)

  createEffect(() => {
    const current = controls
    current.connect()
    onCleanup(() => current.dispose())
  })

  createEffect(() => {
    if (props.makeDefault) {
      const old = store.controls
      store.set({ controls })
      onCleanup(() => store.set({ controls: old }))
    }
  })

  // s3f:   unclean why dispose is getting a type-error
  return controls ? <Primitive ref={props.ref} object={controls} {...rest} /> : null
}
