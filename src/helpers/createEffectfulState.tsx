import { Accessor, createRenderEffect, createSignal, on, onCleanup } from 'solid-js'

type RefType<T> = T | ((state: T) => void)

function call<T>(ref: RefType<T> | undefined, value: T | null) {
  if (typeof ref === 'function') (ref as (state: T) => void)(value as T)
  else if (ref != null) ref = value as T
}

export function createEffectfulState<T>(fn: () => T, deps: Accessor<any[]> = () => [], cb?: RefType<T>) {
  const [state, set] = createSignal<T>()
  createRenderEffect(
    on(deps, () => {
      const value = fn()
      set(value)
      call(cb, value)
      onCleanup(() => {
        call(cb, null)
      })
    })
  )
  return state
}
