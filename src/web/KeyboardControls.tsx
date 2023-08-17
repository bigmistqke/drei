import {
  Accessor,
  createContext,
  createEffect,
  createRenderEffect,
  on,
  onCleanup,
  useContext,
  type JSX,
} from 'solid-js'
import { createStore } from 'solid-js/store'

type KeyboardControlsState<T extends string = string> = { [K in T]: boolean }

export type KeyboardControlsEntry<T extends string = string> = {
  /** Name of the action */
  name: T
  /** The keys that define it, you can use either event.key, or event.code */
  keys: string[]
  /** If the event receives the keyup event, true by default */
  up?: boolean
}

type KeyboardControlsProps = {
  /** A map of named keys */
  map: KeyboardControlsEntry[]
  /** All children will be able to useKeyboardControls */
  children: JSX.Element
  /** Optional onchange event */
  onChange?: (name: string, pressed: boolean, state: KeyboardControlsState) => void
  /** Optional event source */
  domElement?: HTMLElement
}

type Subscribe = (on: Accessor<boolean>, effect: (pressed: boolean) => void) => void

type KeyboardControls<T extends string = string> = [Subscribe, KeyboardControlsState]

const context = /*@__PURE__*/ createContext<KeyboardControls>()

export function KeyboardControls(props: KeyboardControlsProps) {
  const key = () => props.map.map((item) => item.name + item.keys).join('-')
  const [controls, setControls] = createStore<Record<string, boolean>>({})

  createRenderEffect(() => {
    setControls(() => props.map.reduce((prev, cur) => ({ ...prev, [cur.name]: false }), {}))
  })

  createEffect(
    on(key, () => {
      const config = props.map.map(({ name, keys, up }) => ({
        keys,
        up,
        fn: (value: boolean) => {
          // Set solid store
          setControls(name, value)
          // Inform callback
          if (props.onChange) props.onChange(name, value, controls)
        },
      }))
      const keyMap = config.reduce((out, { keys, fn, up = true }) => {
        keys.forEach((key) => (out[key] = { fn, pressed: false, up }))
        return out
      }, {})

      const downHandler = ({ key, code }: KeyboardEvent) => {
        const obj = keyMap[key] || keyMap[code]
        if (!obj) return
        const { fn, pressed, up } = obj
        obj.pressed = true
        if (up || !pressed) fn(true)
      }

      const upHandler = ({ key, code }: KeyboardEvent) => {
        const obj = keyMap[key] || keyMap[code]
        if (!obj) return
        const { fn, up } = obj
        obj.pressed = false
        if (up) fn(false)
      }

      const source = props.domElement || window
      source.addEventListener('keydown', downHandler as EventListenerOrEventListenerObject, { passive: true })
      source.addEventListener('keyup', upHandler as EventListenerOrEventListenerObject, { passive: true })

      onCleanup(() => {
        source.removeEventListener('keydown', downHandler as EventListenerOrEventListenerObject)
        source.removeEventListener('keyup', upHandler as EventListenerOrEventListenerObject)
      })
    })
  )

  function sub<T extends boolean>(boolean: Accessor<T>, effect: (pressed: T) => void) {
    createRenderEffect(on(boolean, effect))
  }

  return <context.Provider value={[sub, controls]} children={props.children} />
}

type Selector<T extends string = string> = (state: KeyboardControlsState<T>) => boolean

export function useKeyboardControls<T extends string = string>(): [Subscribe, KeyboardControlsState]
export function useKeyboardControls<T extends string = string>(sel: Selector<T>): Accessor<ReturnType<Selector<T>>>
export function useKeyboardControls<T extends string = string>(
  sel?: Selector<T>
): Accessor<ReturnType<Selector<T>>> | [Subscribe, KeyboardControlsState] {
  const [sub, store] = useContext(context)!
  if (sel) return () => sel(store)
  else return [sub, store]
}
