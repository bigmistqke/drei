import { Primitive, SolidThreeFiber, useFrame, useThree } from '@solid-three/fiber'
import { createEffect, createMemo, onCleanup, splitProps, untrack } from 'solid-js'
import * as THREE from 'three'
import { TrackballControls as TrackballControlsImpl } from 'three-stdlib'
import { RefComponent } from '../helpers/typeHelpers'

export type TrackballControlsProps = SolidThreeFiber.Overwrite<
  SolidThreeFiber.Object3DNode<TrackballControlsImpl>,
  {
    target?: SolidThreeFiber.Vector3
    camera?: THREE.Camera
    domElement?: HTMLElement
    regress?: boolean
    makeDefault?: boolean
    onChange?: (e?: THREE.Event) => void
    onStart?: (e?: THREE.Event) => void
    onEnd?: (e?: THREE.Event) => void
  }
>

export const TrackballControls: RefComponent<TrackballControlsImpl, TrackballControlsProps> = (props) => {
  const [, rest] = splitProps(props, ['makeDefault', 'camera', 'domElement', 'regress', 'onChange', 'onStart', 'onEnd'])

  const store = useThree()
  const explCamera = () => {
    return props.camera || store.camera
  }
  const explDomElement = () => (props.domElement || store.events.connected || store.gl.domElement) as HTMLElement
  const controls = createMemo(() => new TrackballControlsImpl(explCamera() as THREE.PerspectiveCamera))

  useFrame(() => {
    if (controls().enabled) controls().update()
  }, -1)

  createEffect(() => {
    controls().connect(explDomElement())
    onCleanup(() => controls().dispose())
  })

  createEffect(() => {
    const callback = (e: THREE.Event) => {
      store.invalidate()
      if (props.regress) store.performance.regress()
      if (props.onChange) props.onChange(e)
    }
    controls().addEventListener('change', callback)
    if (props.onStart) controls().addEventListener('start', props.onStart)
    if (props.onEnd) controls().addEventListener('end', props.onEnd)

    onCleanup(() => {
      if (props.onStart) controls().removeEventListener('start', props.onStart)
      if (props.onEnd) controls().removeEventListener('end', props.onEnd)
      controls().removeEventListener('change', callback)
    })
  })

  createEffect(() => {
    controls().handleResize()
  })

  createEffect(() => {
    if (props.makeDefault) {
      console.log('TrackballControls is ', store, store.portal)
      const old = untrack(() => store.controls)
      store.set({ controls: controls() })
      onCleanup(() => store.set({ controls: old }))
    }
  })

  return <Primitive ref={props.ref} object={controls()} {...rest} />
}
