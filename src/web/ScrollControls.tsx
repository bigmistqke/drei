import { RootState, T, context as fiberContext, useFrame, useThree, type DomEvent } from '@solid-three/fiber'
import { easing } from 'maath'
// import * as ReactDOM from 'react-dom/client'
import {
  createContext,
  createEffect,
  createMemo,
  createRenderEffect,
  on,
  onCleanup,
  splitProps,
  untrack,
  useContext,
  type JSX,
} from 'solid-js'
import { Dynamic, render } from 'solid-js/web'
import * as THREE from 'three'
import { createRef } from '../helpers/createRef'
import { defaultProps } from '../helpers/defaultProps'
import { mergeRefs } from '../helpers/mergeRefs'
import { RefComponent } from '../helpers/typeHelpers'

export type ScrollControlsProps = {
  /** Precision, default 0.00001 */
  eps?: number
  /** Horontal scroll, default false (vertical) */
  horizontal?: boolean
  /** Infinite scroll, default false (experimental!) */
  infinite?: boolean
  /** Defines the lenght of the scroll area, each page is height:100%, default 1 */
  pages?: number
  /** A factor that increases scroll bar travel,default: 1 */
  distance?: number
  /** Friction in seconds, default: 0.2 (1/5 second) */
  damping?: number
  /** maxSpeed optionally allows you to clamp the maximum speed. If damping is 0.2s and looks OK
   *  going between, say, page 1 and 2, but not for pages far apart as it'll move very rapid,
   *  then a maxSpeed of e.g. 3 which will clamp the speed to 3 units per second, it may now
   *  take much longer than damping to reach the target if it is far away. Default: Infinity */
  maxSpeed?: number
  enabled?: boolean
  style?: JSX.CSSProperties
  children: JSX.Element
}

export type ScrollControlsState = {
  el: HTMLDivElement
  eps: number
  fill: HTMLDivElement
  fixed: HTMLDivElement
  horizontal: boolean | undefined
  damping: number
  offset: number
  delta: number
  pages: number
  range(from: number, distance: number, margin?: number): number
  curve(from: number, distance: number, margin?: number): number
  visible(from: number, distance: number, margin?: number): boolean
}

const context = createContext<ScrollControlsState>(null!)

export function useScroll() {
  return useContext(context)
}

export function ScrollControls(_props: ScrollControlsProps) {
  const props = defaultProps(_props, {
    eps: 0.00001,
    enabled: true,
    pages: 1,
    distance: 1,
    damping: 0.25,
    maxSpeed: Infinity,
    style: {},
  })

  const store = useThree()
  const el = document.createElement('div')
  const fill = document.createElement('div')
  const fixed = document.createElement('div')
  const target = () => store.gl.domElement.parentNode! as HTMLElement
  let scroll = 0

  const state = createMemo(() => {
    const state = {
      el,
      eps: props.eps,
      fill,
      fixed,
      horizontal: props.horizontal,
      damping: props.damping,
      offset: 0,
      delta: 0,
      scroll,
      pages: props.pages,
      // 0-1 for a range between from -> from + distance
      range(from: number, distance: number, margin: number = 0) {
        const start = from - margin
        const end = start + distance + margin * 2
        return this.offset < start ? 0 : this.offset > end ? 1 : (this.offset - start) / (end - start)
      },
      // 0-1-0 for a range between from -> from + distance
      curve(from: number, distance: number, margin: number = 0) {
        return Math.sin(this.range(from, distance, margin) * Math.PI)
      },
      // true/false for a range between from -> from + distance
      visible(from: number, distance: number, margin: number = 0) {
        const start = from - margin
        const end = start + distance + margin * 2
        return this.offset >= start && this.offset <= end
      },
    }
    return state
  })

  createEffect(() => {
    el.style.position = 'absolute'
    el.style.width = '100%'
    el.style.height = '100%'
    el.style[props.horizontal ? 'overflowX' : 'overflowY'] = 'auto'
    el.style[props.horizontal ? 'overflowY' : 'overflowX'] = 'hidden'
    el.style.top = '0px'
    el.style.left = '0px'

    for (const key in props.style) {
      el.style[key] = props.style[key]
    }

    fixed.style.position = 'sticky'
    fixed.style.top = '0px'
    fixed.style.left = '0px'
    fixed.style.width = '100%'
    fixed.style.height = '100%'
    fixed.style.overflow = 'hidden'
    el.appendChild(fixed)

    fill.style.height = props.horizontal ? '100%' : `${props.pages * props.distance * 100}%`
    fill.style.width = props.horizontal ? `${props.pages * props.distance * 100}%` : '100%'
    fill.style.pointerEvents = 'none'
    el.appendChild(fill)
    target().appendChild(el)

    // Init scroll one pixel in to allow upward/leftward scroll
    el[props.horizontal ? 'scrollLeft' : 'scrollTop'] = 1

    const oldTarget = untrack(() => (store.events.connected || store.gl.domElement) as HTMLElement)
    requestAnimationFrame(() => store.events.connect?.(el))
    const oldCompute = untrack(() => store.events.compute)

    store.setEvents({
      compute(event: DomEvent, state: RootState) {
        // we are using boundingClientRect because we could not rely on target.offsetTop as canvas could be positioned anywhere in dom
        const { left, top } = target().getBoundingClientRect()
        const offsetX = event.clientX - left
        const offsetY = event.clientY - top
        state.pointer.set((offsetX / state.size.width) * 2 - 1, -(offsetY / state.size.height) * 2 + 1)
        state.raycaster.setFromCamera(state.pointer, state.camera)
      },
    })

    onCleanup(() => {
      target().removeChild(el)
      store.setEvents({ compute: oldCompute })
      store.events.connect?.(oldTarget)
    })
  })

  createEffect(() => {
    if (store.events.connected === el) {
      const containerLength = store.size[props.horizontal ? 'width' : 'height']
      const scrollLength = el[props.horizontal ? 'scrollWidth' : 'scrollHeight']
      const scrollThreshold = scrollLength - containerLength

      let current = 0
      let disableScroll = true
      let firstRun = true

      const onScroll = () => {
        // Prevent first scroll because it is indirectly caused by the one pixel offset
        if (!props.enabled || firstRun) return
        store.invalidate()
        current = el[props.horizontal ? 'scrollLeft' : 'scrollTop']
        scroll = current / scrollThreshold

        if (props.infinite) {
          if (!disableScroll) {
            if (current >= scrollThreshold) {
              const damp = 1 - state().offset
              el[props.horizontal ? 'scrollLeft' : 'scrollTop'] = 1
              scroll = state().offset = -damp
              disableScroll = true
            } else if (current <= 0) {
              const damp = 1 + state().offset
              el[props.horizontal ? 'scrollLeft' : 'scrollTop'] = scrollLength
              scroll = state().offset = damp
              disableScroll = true
            }
          }
          if (disableScroll) setTimeout(() => (disableScroll = false), 40)
        }
      }
      el.addEventListener('scroll', onScroll, { passive: true })
      requestAnimationFrame(() => (firstRun = false))

      const onWheel = (e) => (el.scrollLeft += e.deltaY / 2)
      if (props.horizontal) el.addEventListener('wheel', onWheel, { passive: true })

      onCleanup(() => {
        el.removeEventListener('scroll', onScroll)
        if (props.horizontal) el.removeEventListener('wheel', onWheel)
      })
    }
  })

  let last = 0
  useFrame((_, delta) => {
    last = state().offset
    easing.damp(state(), 'offset', scroll, props.damping, delta, props.maxSpeed, undefined, props.eps)
    easing.damp(
      state(),
      'delta',
      Math.abs(last - state().offset),
      props.damping,
      delta,
      props.maxSpeed,
      undefined,
      props.eps
    )
    if (state().delta > props.eps) store.invalidate()
  })
  return <context.Provider value={state()}>{props.children}</context.Provider>
}

const ScrollCanvas: RefComponent<THREE.Group, { children: JSX.Element }> = (props) => {
  const group = createRef<THREE.Group>(null!)
  const state = useScroll()!
  const store = useThree()
  useFrame(() => {
    group.ref.position.x = state.horizontal ? -store.viewport.width * (state.pages - 1) * state.offset : 0
    group.ref.position.y = state.horizontal ? 0 : store.viewport.height * (state.pages - 1) * state.offset
  })
  return <T.Group ref={mergeRefs(props, group)}>{props.children}</T.Group>
}

const ScrollHtml: RefComponent<any, { children?: JSX.Element; style?: JSX.CSSProperties }> = (_props) => {
  const [props, rest] = splitProps(_props, ['children', 'style', 'ref'])
  const state = useScroll()!
  const group = createRef<HTMLDivElement>(null!)

  const store = useThree()

  const fiberState = useContext(fiberContext)

  useFrame(() => {
    if (state.delta > state.eps) {
      group.ref.style.transform = `translate3d(${
        state.horizontal ? -store.size.width * (state.pages - 1) * state.offset : 0
      }px,${state.horizontal ? 0 : store.size.height * (state.pages - 1) * -state.offset}px,0)`
    }
  })

  // s3f:   added the render in a render-effect since in r3f's codebase
  //        they were doing root.render, with root being `useMemo(() => createRoot(state.fixed))
  //        should we be cleaning up the render-function?
  createRenderEffect(
    on(
      () => state.fixed,
      () => {
        render(
          () => (
            <div
              ref={mergeRefs(props, group)}
              style={{ ...props.style, position: 'absolute', top: 0, left: 0, 'will-change': 'transform' }}
              {...rest}
            >
              <context.Provider value={state}>
                <fiberContext.Provider value={fiberState}>{props.children}</fiberContext.Provider>
              </context.Provider>
            </div>
          ),
          state.fixed
        )
      }
    )
  )
  return null
}

type ScrollProps = {
  html?: boolean
  children?: JSX.Element
}

export const Scroll: RefComponent<any, ScrollProps> = (_props) => {
  const [props, rest] = splitProps(_props, ['html'])
  return <Dynamic component={props.html ? ScrollHtml : ScrollCanvas} {...rest} />
}
