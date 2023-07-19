import { Primitive, ReactThreeFiber, useFrame, useThree } from '@solid-three/fiber'
// import * as React from 'react'
import { createEffect, createMemo, splitProps } from 'solid-js'
import type { Camera, Event } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { forwardRef } from '../helpers/forwardRef'

export type OrbitControlsChangeEvent = Event & {
  target: EventTarget & { object: Camera }
}

export type OrbitControlsProps = Omit<
  ReactThreeFiber.Overwrite<
    ReactThreeFiber.Object3DNode<OrbitControlsImpl>,
    {
      camera?: Camera
      domElement?: HTMLElement
      enableDamping?: boolean
      makeDefault?: boolean
      onChange?: (e?: OrbitControlsChangeEvent) => void
      onEnd?: (e?: Event) => void
      onStart?: (e?: Event) => void
      regress?: boolean
      target?: ReactThreeFiber.Vector3
      keyEvents?: boolean | HTMLElement
    }
  >,
  'ref'
>

export const OrbitControls = forwardRef<OrbitControlsImpl, OrbitControlsProps>((props, ref) => {
  const [_, restProps] = splitProps(props, [
    'makeDefault',
    'camera',
    'regress',
    'domElement',
    'enableDamping',
    'keyEvents',
    'onChange',
    'onStart',
    'onEnd',
  ])
  const store = useThree()
  const explDomElement = () => (props.domElement || store.events.connected || store.gl.domElement) as HTMLElement
  const camera = () => (props.camera || store.camera) as THREE.OrthographicCamera | THREE.PerspectiveCamera
  const controls = createMemo(() => new OrbitControlsImpl(camera()))

  useFrame(() => {
    if (controls().enabled) controls().update()
  }, -1)

  createEffect(() => {
    if (props.keyEvents) {
      controls().connect(props.keyEvents === true ? explDomElement() : props.keyEvents)
    }

    controls().connect(explDomElement())
    return () => void controls().dispose()
  }, [props.keyEvents, explDomElement(), props.regress, controls(), store.invalidate])

  createEffect(() => {
    const callback = (e: OrbitControlsChangeEvent) => {
      store.invalidate()
      if (props.regress) store.performance.regress()
      if (props.onChange) props.onChange(e)
    }

    const onStartCb = (e: Event) => {
      if (props.onStart) props.onStart(e)
    }

    const onEndCb = (e: Event) => {
      if (props.onEnd) props.onEnd(e)
    }

    controls().addEventListener('change', callback)
    controls().addEventListener('start', onStartCb)
    controls().addEventListener('end', onEndCb)

    return () => {
      controls().removeEventListener('start', onStartCb)
      controls().removeEventListener('end', onEndCb)
      controls().removeEventListener('change', callback)
    }
  }, [props.onChange, props.onStart, props.onEnd, controls(), store.invalidate, store.setEvents])

  createEffect(() => {
    if (props.makeDefault) {
      const old = store.controls
      store.set({ controls: controls() })
      return () => store.set({ controls: old })
    }
  }, [props.makeDefault, controls()])

  return <Primitive ref={ref} object={controls()} enableDamping={props.enableDamping} {...restProps} />
})
