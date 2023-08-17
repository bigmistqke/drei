import { Primitive, SolidThreeFiber, T, useThree } from '@solid-three/fiber'
import { Accessor, JSX, createEffect, createMemo, onCleanup, splitProps, untrack } from 'solid-js'
import * as THREE from 'three'
import { TransformControls as TransformControlsImpl } from 'three-stdlib'
import { RefComponent } from '../helpers/typeHelpers'

type ControlsProto = {
  enabled: boolean
}

export type TransformControlsProps = SolidThreeFiber.Object3DNode<TransformControlsImpl> &
  Omit<Parameters<typeof T.Group>[0], 'ref'> & {
    object?: THREE.Object3D | Accessor<THREE.Object3D>
    enabled?: boolean
    axis?: string | null
    domElement?: HTMLElement
    mode?: 'translate' | 'rotate' | 'scale'
    translationSnap?: number | null
    rotationSnap?: number | null
    scaleSnap?: number | null
    space?: 'world' | 'local'
    size?: number
    showX?: boolean
    showY?: boolean
    showZ?: boolean
    children?: JSX.Element
    camera?: THREE.Camera
    onChange?: (e?: THREE.Event) => void
    onMouseDown?: (e?: THREE.Event) => void
    onMouseUp?: (e?: THREE.Event) => void
    onObjectChange?: (e?: THREE.Event) => void
    makeDefault?: boolean
  }

export const TransformControls: RefComponent<TransformControlsImpl, TransformControlsProps> = (_props) => {
  const [props, rest] = splitProps(_props, [
    'camera',
    'children',
    'domElement',
    'onChange',
    'onMouseDown',
    'onMouseUp',
    'onObjectChange',
    'object',
    'makeDefault',
  ])

  const [transformProps, objectProps] = splitProps(rest, [
    'ref',
    'enabled',
    'axis',
    'mode',
    'translationSnap',
    'rotationSnap',
    'scaleSnap',
    'space',
    'size',
    'showX',
    'showY',
    'showZ',
  ])

  const store = useThree()
  const explCamera = () => props.camera || store.camera
  const explDomElement = () => (props.domElement || store.events.connected || store.gl.domElement) as HTMLElement
  const controls = createMemo(() => new TransformControlsImpl(explCamera(), explDomElement()))
  let group: THREE.Group

  createEffect(() => {
    if (props.object) {
      controls().attach(props.object instanceof THREE.Object3D ? props.object : props.object())
    } else if (group instanceof THREE.Object3D) {
      controls().attach(group)
    }
    onCleanup(() => controls().detach())
  })

  createEffect(() => {
    if (store.controls) {
      const callback = (event) => ((store.controls as any as ControlsProto).enabled = !event.value)
      controls().addEventListener('dragging-changed', callback)
      onCleanup(() => controls().removeEventListener('dragging-changed', callback))
    }
  })

  createEffect(() => {
    const onChange = (e: THREE.Event) => {
      store.invalidate()
      props.onChange?.(e)
    }

    const onMouseDown = (e: THREE.Event) => props.onMouseDown?.(e)
    const onMouseUp = (e: THREE.Event) => props.onMouseUp?.(e)
    const onObjectChange = (e: THREE.Event) => props.onObjectChange?.(e)

    controls().addEventListener('change', onChange)
    controls().addEventListener('mouseDown', onMouseDown)
    controls().addEventListener('mouseUp', onMouseUp)
    controls().addEventListener('objectChange', onObjectChange)

    onCleanup(() => {
      controls().removeEventListener('change', onChange)
      controls().removeEventListener('mouseDown', onMouseDown)
      controls().removeEventListener('mouseUp', onMouseUp)
      controls().removeEventListener('objectChange', onObjectChange)
    })
  })

  createEffect(() => {
    if (props.makeDefault) {
      const old = untrack(() => store.controls)
      store.set({
        controls: controls(),
      })
      onCleanup(() => store.set({ controls: old }))
    }
  })
  return (
    <>
      <Primitive object={controls()} {...transformProps} />
      <T.Group ref={group!} {...objectProps}>
        {props.children}
      </T.Group>
    </>
  )
}
