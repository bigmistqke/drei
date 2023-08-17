import { useThree } from '@solid-three/fiber'
import { createEffect, onCleanup } from 'solid-js'

export function AdaptiveDpr({ pixelated }: { pixelated?: boolean }) {
  const store = useThree()

  // Restore initial pixelratio on unmount
  createEffect(() => {
    const domElement = store.gl.domElement
    onCleanup(() => {
      if (store.internal.active) store.setDpr(store.viewport.initialDpr)
      if (pixelated && domElement) domElement.style.imageRendering = 'auto'
    })
  }, [])
  // Set adaptive pixelratio
  createEffect(() => {
    store.setDpr(store.performance.current * store.viewport.initialDpr)
    if (pixelated && store.gl.domElement)
      store.gl.domElement.style.imageRendering = store.performance.current === 1 ? 'auto' : 'pixelated'
  }, [store.performance.current])
  return null
}
