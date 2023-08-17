import { DomEvent, Primitive, RootState, SolidThreeFiber, useThree } from '@solid-three/fiber'
import { createEffect, createMemo, onCleanup, splitProps, untrack } from 'solid-js'
import * as THREE from 'three'
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import { RefComponent } from '../helpers/typeHelpers'

export type PointerLockControlsProps = SolidThreeFiber.Object3DNode<PointerLockControlsImpl> & {
  domElement?: HTMLElement
  selector?: string
  enabled?: boolean
  camera?: THREE.Camera
  onChange?: (e?: THREE.Event) => void
  onLock?: (e?: THREE.Event) => void
  onUnlock?: (e?: THREE.Event) => void
  makeDefault?: boolean
}

export const PointerLockControls: RefComponent<PointerLockControlsImpl, PointerLockControlsProps> = (props) => {
  const [, rest] = splitProps(props, [
    'domElement',
    'selector',
    'onChange',
    'onLock',
    'onUnlock',
    'enabled',
    'makeDefault',
  ])

  const store = useThree()

  const explCamera = () => props.camera || store.camera
  const explDomElement = () => (props.domElement || store.events.connected || store.gl.domElement) as HTMLElement

  const controls = createMemo(() => {
    const pointerLock = new PointerLockControlsImpl(explCamera())
    return pointerLock
  })

  createEffect(() => {
    if (props.makeDefault) {
      const old = untrack(() => store.controls)
      store.set({ controls: controls() })
      onCleanup(() => store.set({ controls: old }))
    }
  })

  createEffect(() => {
    if (props.enabled || props.enabled === undefined) {
      controls().connect(explDomElement())

      // Force events to be centered while PLC is active
      const oldComputeOffsets = untrack(() => store.events.compute)
      store.setEvents({
        compute(event: DomEvent, state: RootState) {
          const offsetX = state.size.width / 2
          const offsetY = state.size.height / 2
          state.pointer.set((offsetX / state.size.width) * 2 - 1, -(offsetY / state.size.height) * 2 + 1)
          state.raycaster.setFromCamera(state.pointer, state.camera)
        },
      })
      onCleanup(() => {
        controls().disconnect()
        store.setEvents({ compute: oldComputeOffsets })
      })
    }
  })

  createEffect(() => {
    const callback = (e: THREE.Event) => {
      store.invalidate()
      if (props.onChange) props.onChange(e)
    }

    controls().addEventListener('change', callback)

    if (props.onLock) controls().addEventListener('lock', props.onLock)
    if (props.onUnlock) controls().addEventListener('unlock', props.onUnlock)

    // Enforce previous interaction
    const handler = () => controls().lock()
    const elements = props.selector ? Array.from(document.querySelectorAll(props.selector)) : [document]

    elements.forEach((element) => element && element.addEventListener('click', handler))

    onCleanup(() => {
      controls().removeEventListener('change', callback)
      if (props.onLock) controls().addEventListener('lock', props.onLock)
      if (props.onUnlock) controls().addEventListener('unlock', props.onUnlock)
      elements.forEach((element) => (element ? element.removeEventListener('click', handler) : undefined))
    })
  })

  return <Primitive ref={props.ref} object={controls()} {...rest} />
}
