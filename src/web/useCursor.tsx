import { Accessor, createEffect, onCleanup } from 'solid-js'

export function useCursor(hovered: Accessor<boolean>, onPointerOver = () => 'pointer', onPointerOut = () => 'auto') {
  createEffect(() => {
    if (hovered()) {
      document.body.style.cursor = onPointerOver()
      onCleanup(() => {
        document.body.style.cursor = onPointerOut()
      })
    }
  })
}
