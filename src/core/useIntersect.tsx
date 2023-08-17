import { addAfterEffect, addEffect } from '@solid-three/fiber'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { when } from '../helpers/when'

export function useIntersect<T extends THREE.Object3D>(onChange: (visible: boolean) => void) {
  // let ref: T = null!
  const [ref, setRef] = createSignal<T>()
  let check = false
  let temp = false

  createEffect(() => {
    when(ref)((ref) => {
      // Stamp out frustum check pre-emptively
      const unsub1 = addEffect(() => {
        check = false
        return true
      })
      // If the object is inside the frustum three will call onRender
      const oldOnRender = ref.onBeforeRender
      ref.onBeforeRender = () => (check = true)
      // Compare the check value against the temp value, if it differs set state
      const unsub2 = addAfterEffect(() => {
        if (check !== temp) onChange((temp = check))
        return true
      })
      onCleanup(() => {
        ref.onBeforeRender = oldOnRender
        unsub1()
        unsub2()
      })
    })
  })
  return [ref, setRef] as const
}
