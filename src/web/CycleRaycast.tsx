import { useThree } from '@solid-three/fiber'
import { createEffect, onCleanup } from 'solid-js'
import * as THREE from 'three'
import { defaultProps } from '../helpers/defaultProps'

export type CycleRaycastProps = {
  onChanged?: (hits: THREE.Intersection[], cycle: number) => null
  preventDefault?: boolean
  scroll?: boolean
  keyCode?: number
  portal?: HTMLElement
}

export function CycleRaycast(_props: CycleRaycastProps) {
  const props = defaultProps(_props, {
    preventDefault: true,
    scroll: true,
    keyCode: 9,
  })

  let cycle = 0
  const store = useThree()

  createEffect(() => {
    let hits: THREE.Intersection[] = []
    let lastEvent: PointerEvent = undefined!
    const prev = store.events.filter
    const target = props.portal ?? store.gl.domElement.parentNode

    // Render custom status
    const renderStatus = () => target && props.onChanged && props.onChanged(hits, Math.round(cycle) % hits.length)

    // Overwrite the raycasters custom filter (this only exists in r3f)
    store.setEvents({
      filter: (intersections, state) => {
        // Reset cycle when the intersections change
        let clone = [...intersections]
        if (
          clone.length !== hits.length ||
          !hits.every((hit) => clone.map((e) => e.object.uuid).includes(hit.object.uuid))
        ) {
          cycle = 0
          hits = clone
          renderStatus()
        }
        // Run custom filter if there is one
        if (prev) clone = prev(clone, state)
        // Cycle through the actual raycast intersects
        for (let i = 0; i < Math.round(cycle) % clone.length; i++) {
          const first = clone.shift() as THREE.Intersection
          clone = [...clone, first]
        }
        return clone
      },
    })

    // Cycle, refresh events and render status
    const refresh = (fn) => {
      cycle = fn(cycle)
      // Cancel hovered elements and fake a pointer-move
      store.events.handlers?.onPointerCancel(undefined as any)
      store.events.handlers?.onPointerMove(lastEvent)
      renderStatus()
    }

    // Key events
    const tabEvent = (event: KeyboardEvent) => {
      if (event.keyCode || event.which === props.keyCode) {
        if (props.preventDefault) event.preventDefault()
        if (hits.length > 1) refresh((current) => current + 1)
      }
    }

    // Wheel events
    const wheelEvent = (event: WheelEvent) => {
      if (props.preventDefault) event.preventDefault()
      let delta = 0
      if (!event) event = window.event as WheelEvent
      if ((event as any).wheelDelta) delta = (event as any).wheelDelta / 120
      else if (event.detail) delta = -event.detail / 3
      if (hits.length > 1) refresh((current) => Math.abs(current - delta))
    }

    // Catch last move event and position custom status
    const moveEvent = (event: PointerEvent) => (lastEvent = event)

    document.addEventListener('pointermove', moveEvent, { passive: true })
    if (props.scroll) document.addEventListener('wheel', wheelEvent)
    if (props.keyCode !== undefined) document.addEventListener('keydown', tabEvent)

    onCleanup(() => {
      // Clean up
      store.setEvents({ filter: prev })
      if (props.keyCode !== undefined) document.removeEventListener('keydown', tabEvent)
      if (props.scroll) document.removeEventListener('wheel', wheelEvent)
      document.removeEventListener('pointermove', moveEvent)
    })
  })
  return null
}
