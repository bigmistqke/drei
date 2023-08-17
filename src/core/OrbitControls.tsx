import { Primitive, SolidThreeFiber, useFrame, useThree } from '@solid-three/fiber'
// import { createEffect, createRenderEffect, createSignal , createMemo} from 'solid-js'
import { createEffect, createMemo, onCleanup, untrack } from 'solid-js'
import type { Camera, Event } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

export type OrbitControlsChangeEvent = Event & {
  target: EventTarget & { object: Camera }
}

export type OrbitControlsProps = Omit<
  SolidThreeFiber.Overwrite<
    SolidThreeFiber.Object3DNode<OrbitControlsImpl>,
    {
      camera?: Camera
      domElement?: HTMLElement
      enableDamping?: boolean
      makeDefault?: boolean
      onChange?: (e?: OrbitControlsChangeEvent) => void
      onEnd?: (e?: Event) => void
      onStart?: (e?: Event) => void
      regress?: boolean
      target?: SolidThreeFiber.Vector3
      keyEvents?: boolean | HTMLElement
    }
  >,
  'ref'
>

export const OrbitControls: RefComponent<OrbitControlsImpl, OrbitControlsProps> = (props) => {
  const [, rest] = processProps(
    props,
    {
      enableDamping: true,
      keyEvents: false,
    },
    ['makeDefault', 'camera', 'regress', 'domElement', 'keyEvents', 'onChange', 'onStart', 'onEnd', 'object', 'dispose']
  )
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
    onCleanup(() => void controls().dispose())
  })

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

    onCleanup(() => {
      controls().removeEventListener('start', onStartCb)
      controls().removeEventListener('end', onEndCb)
      controls().removeEventListener('change', callback)
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
