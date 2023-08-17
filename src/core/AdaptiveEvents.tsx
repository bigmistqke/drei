import { useThree } from '@solid-three/fiber'
import { createEffect, onCleanup } from 'solid-js'

export function AdaptiveEvents() {
  const store = useThree()
  createEffect(() => {
    const enabled = store.events.enabled
    onCleanup(() => store.setEvents({ enabled }))
  }, [])
  createEffect(() => store.setEvents({ enabled: store.performance.current === 1 }))
  return null
}
