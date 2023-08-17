import {
  Box3,
  EventDispatcher,
  MathUtils,
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Sphere,
  Spherical,
  Vector2,
  Vector3,
  Vector4,
} from 'three'

import { Primitive, SolidThreeFiber, extend, useFrame, useThree } from '@solid-three/fiber'

import CameraControlsImpl from 'camera-controls'
import { createEffect, createMemo, onCleanup, splitProps } from 'solid-js'
import { RefComponent } from '../helpers/typeHelpers'

export type CameraControlsProps = Omit<
  SolidThreeFiber.Overwrite<
    SolidThreeFiber.Node<CameraControlsImpl>,
    {
      camera?: PerspectiveCamera | OrthographicCamera
      domElement?: HTMLElement
      makeDefault?: boolean
      onStart?: (e?: { type: 'controlstart' }) => void
      onEnd?: (e?: { type: 'controlend' }) => void
      onChange?: (e?: { type: 'update' }) => void
      events?: boolean // Wether to enable events during controls interaction
      regress?: boolean
    }
  >,
  'ref'
>

export const CameraControls: RefComponent<CameraControlsImpl, CameraControlsProps> = (_props) => {
  ;(() => {
    // to allow for tree shaking, we only import the subset of THREE that is used by camera-controls
    // see https://github.com/yomotsu/camera-controls#important
    const subsetOfTHREE = {
      Box3,
      MathUtils: {
        clamp: MathUtils.clamp,
      },
      Matrix4,
      Quaternion,
      Raycaster,
      Sphere,
      Spherical,
      Vector2,
      Vector3,
      Vector4,
    }

    CameraControlsImpl.install({ THREE: subsetOfTHREE })
    extend({ CameraControlsImpl })
  })()
  const [props, rest] = splitProps(_props, [
    'ref',
    'camera',
    'domElement',
    'makeDefault',
    'onStart',
    'onEnd',
    'onChange',
    'regress',
  ])
  const store = useThree()
  const explCamera = () => props.camera || store.camera

  const explDomElement = () => (props.domElement || store.events.connected || store.gl.domElement) as HTMLElement

  const controls = createMemo(() => new CameraControlsImpl(explCamera()))

  useFrame((_, delta) => {
    if (controls().enabled) controls().update(delta)
  }, -1)

  createEffect(() => {
    controls().connect(explDomElement())
    onCleanup(() => controls().disconnect())
  })

  createEffect(() => {
    const callback = (e) => {
      // s3f    we do not pass invalidate to Portals
      //        so it was sometimes undefined
      //        also unclear what invalidate actually does bc it works without it too
      store.invalidate?.()
      if (props.regress) store.performance.regress()
      if (props.onChange) props.onChange(e)
    }

    const onStartCb: CameraControlsProps['onStart'] = (e) => {
      if (props.onStart) props.onStart(e)
    }

    const onEndCb: CameraControlsProps['onEnd'] = (e) => {
      if (props.onEnd) props.onEnd(e)
    }

    controls().addEventListener('update', callback)
    controls().addEventListener('controlstart', onStartCb)
    controls().addEventListener('controlend', onEndCb)
    controls().addEventListener('control', callback)
    controls().addEventListener('transitionstart', callback)
    controls().addEventListener('wake', callback)
    onCleanup(() => {
      controls().removeEventListener('update', callback)
      controls().removeEventListener('controlstart', onStartCb)
      controls().removeEventListener('controlend', onEndCb)
      controls().removeEventListener('control', callback)
      controls().removeEventListener('transitionstart', callback)
      controls().removeEventListener('wake', callback)
    })
  })

  createEffect(() => {
    if (props.makeDefault) {
      const old = store.controls
      store.set({ controls: controls() as unknown as EventDispatcher })
      onCleanup(() => store.set({ controls: old }))
    }
  })

  return <Primitive ref={props.ref} object={controls()} {...rest} />
}

export type CameraControls = CameraControlsImpl
