import { createRenderEffect, on } from 'solid-js'
import { when } from './when'

export function createImperativeHandle<T extends any>(
  props: { ref?: T | ((value: T) => any) },
  ref: () => T | undefined,
  dependency?: () => any
) {
  const effect = () =>
    when(ref)((ref) => {
      if (typeof props.ref === 'function') props.ref(ref)
      else props.ref = ref
    })
  if (dependency) createRenderEffect(on(dependency, effect))
  else createRenderEffect(effect)
}
