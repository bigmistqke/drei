import { Accessor } from 'solid-js'

/* <Show/> and <For/> return signals */
export function resolveAccessor<T>(child: Accessor<T> | T, recursive = false): T {
  return typeof child !== 'function'
    ? child
    : recursive
    ? resolveAccessor((child as Accessor<T>)())
    : (child as Accessor<T>)()
}
