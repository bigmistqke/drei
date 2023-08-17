import { Primitive, SolidThreeFiber, useFrame, useThree } from '@solid-three/fiber'
import { ArcballControls as ArcballControlsImpl } from 'three-stdlib'

import { createEffect, createMemo, on, onCleanup, splitProps, untrack } from 'solid-js'
import type { Event, OrthographicCamera, PerspectiveCamera } from 'three'
import { RefComponent } from '../helpers/typeHelpers'

export type ArcballControlsProps = Omit<
  SolidThreeFiber.Overwrite<
    SolidThreeFiber.Object3DNode<ArcballControlsImpl>,
    {
      target?: SolidThreeFiber.Vector3
      camera?: OrthographicCamera | PerspectiveCamera
      domElement?: HTMLElement
      regress?: boolean
      makeDefault?: boolean
      onChange?: (e?: Event) => void
      onStart?: (e?: Event) => void
      onEnd?: (e?: Event) => void
    }
  >,
  'ref'
>

export const ArcballControls: RefComponent<ArcballControlsImpl, ArcballControlsProps> = (_props) => {
  const [props, rest] = splitProps(_props, [
    'ref',
    'camera',
    'makeDefault',
    'regress',
    'domElement',
    'onChange',
    'onStart',
    'onEnd',
  ])
  const store = useThree()
  const explCamera = () => props.camera || store.camera
  const explDomElement = () => (props.domElement || store.events.connected || store.gl.domElement) as HTMLElement
  const controls = createMemo(() => new ArcballControlsImpl(explCamera()))

  useFrame(() => {
    if (controls().enabled) controls().update()
  }, -1)

  createEffect(
    on(
      () => [explDomElement(), props.regress, controls(), store.invalidate],
      () => {
        controls().connect(explDomElement())
        onCleanup(() => controls().dispose())
      }
    )
  )

  createEffect(() => {
    const callback = (e: Event) => {
      store.invalidate()
      if (props.regress) store.performance.regress()
      if (props.onChange) props.onChange(e)
    }

    controls().addEventListener('change', callback)
    if (props.onStart) controls().addEventListener('start', props.onStart)
    if (props.onEnd) controls().addEventListener('end', props.onEnd)

    onCleanup(() => {
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

  return <Primitive ref={props.ref} object={controls()} {...rest} />
}
