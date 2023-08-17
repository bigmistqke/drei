import { useThree } from '@solid-three/fiber'
import { createEffect, onCleanup } from 'solid-js'

export function BakeShadows() {
  const store = useThree()
  createEffect(() => {
    store.gl.shadowMap.autoUpdate = false
    store.gl.shadowMap.needsUpdate = true
    onCleanup(() => (store.gl.shadowMap.autoUpdate = store.gl.shadowMap.needsUpdate = true))
  })
  return null
}
