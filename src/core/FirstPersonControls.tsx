import { Object3DNode, Primitive, useFrame, useThree } from '@solid-three/fiber'
import { createEffect, onCleanup, splitProps, untrack } from 'solid-js'
import { FirstPersonControls as FirstPersonControlImpl } from 'three-stdlib'
import { RefComponent } from '../helpers/typeHelpers'

export type FirstPersonControlsProps = Object3DNode<FirstPersonControlImpl> & {
  domElement?: HTMLElement
  makeDefault?: boolean
}

export const FirstPersonControls: RefComponent<FirstPersonControlImpl, FirstPersonControlsProps> = (_props) => {
  const [props, rest] = splitProps(_props, ['ref', 'domElement', 'makeDefault'])
  const store = useThree()

  const explDomElement = () => (props.domElement || store.events.connected || store.gl.domElement) as HTMLElement
  const controls = new FirstPersonControlImpl(store.camera, explDomElement())

  createEffect(() => {
    if (props.makeDefault) {
      const old = untrack(() => store.controls)
      store.set({ controls })
      onCleanup(() => store.set({ controls: old }))
    }
  })

  useFrame((_, delta) => {
    controls.update(delta)
  }, -1)

  return controls ? <Primitive ref={props.ref} object={controls} {...rest} /> : null
}
