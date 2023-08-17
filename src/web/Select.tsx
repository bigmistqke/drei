import { T, useThree } from '@solid-three/fiber'
import { Accessor, createContext, createEffect, createSignal, onCleanup, untrack, useContext } from 'solid-js'
import * as THREE from 'three'
import { SelectionBox } from 'three-stdlib'
import shallow from 'zustand/shallow'
import { processProps } from '../helpers/processProps'

const context = createContext<Accessor<THREE.Object3D[]>>(() => [])

type Props = Parameters<typeof T.Group>[0] & {
  /** Allow multi select, default: false */
  multiple?: boolean
  /** Allow box select, default: false */
  box?: boolean
  /** Custom CSS border: default: '1px solid #55aaff' */
  border?: string
  /** Curom CSS color, default: 'rgba(75, 160, 255, 0.1)' */
  backgroundColor?: string
  /** Callback for selection changes */
  onChange?: (selected: THREE.Object3D[]) => void
  /** Callback for selection changes once the pointer is up */
  onChangePointerUp?: (selected: THREE.Object3D[]) => void
  /** Optional filter for filtering the selection */
  filter?: (selected: THREE.Object3D[]) => THREE.Object3D[]
}

export function Select(_props: Props) {
  const [props, rest] = processProps(
    _props,
    {
      border: '1px solid #55aaff',
      backgroundColor: 'rgba(75, 160, 255, 0.1)',
      filter: (item) => item,
    },
    ['box', 'multiple', 'children', 'onChange', 'onChangePointerUp', 'border', 'backgroundColor', 'filter']
  )

  const [downed, down] = createSignal(false)
  const store = useThree()
  const [hovered, hover] = createSignal(false)

  const [active, setActive] = createSignal<THREE.Object3D[]>([])

  const dispatch = ({ object, shift }: { object?: THREE.Object3D | THREE.Object3D[]; shift?: boolean }) => {
    if (object === undefined) setActive([])
    else if (Array.isArray(object)) setActive(object)
    else if (!shift) setActive(active()[0] === object ? [] : [object])
    else if (active().includes(object)) setActive(active().filter((o) => o !== object))
    else setActive([object, ...active()])
  }

  createEffect(() => {
    if (downed()) props.onChange?.(active())
    else props.onChangePointerUp?.(active())
  })
  const onClick = (e) => {
    e.stopPropagation()
    dispatch({ object: props.filter([e.object])[0], shift: props.multiple && e.shiftKey })
  }
  const onPointerMissed = (e) => !hovered() && dispatch({})

  let ref: THREE.Group = null!
  createEffect(() => {
    if (!props.box || !props.multiple) return

    const selBox = new SelectionBox(store.camera, ref as unknown as THREE.Scene)

    const element = document.createElement('div')
    element.style.pointerEvents = 'none'
    element.style.border = props.border
    element.style.backgroundColor = props.backgroundColor
    element.style.position = 'fixed'

    const startPoint = new THREE.Vector2()
    const pointTopLeft = new THREE.Vector2()
    const pointBottomRight = new THREE.Vector2()

    // s3f: was using get(). before, hence the untrack
    const oldRaycasterEnabled = untrack(() => store.events.enabled)
    const oldControlsEnabled = (store.controls as any)?.enabled

    function prepareRay(event, vec) {
      const { offsetX, offsetY } = event
      const { width, height } = store.size
      vec.set((offsetX / width) * 2 - 1, -(offsetY / height) * 2 + 1)
    }

    function onSelectStart(event) {
      if (store.controls) (store.controls as any).enabled = false
      store.setEvents({ enabled: false })
      store.gl.domElement.parentElement?.appendChild(element)
      element.style.left = `${event.clientX}px`
      element.style.top = `${event.clientY}px`
      element.style.width = '0px'
      element.style.height = '0px'
      startPoint.x = event.clientX
      startPoint.y = event.clientY
    }

    function onSelectMove(event) {
      pointBottomRight.x = Math.max(startPoint.x, event.clientX)
      pointBottomRight.y = Math.max(startPoint.y, event.clientY)
      pointTopLeft.x = Math.min(startPoint.x, event.clientX)
      pointTopLeft.y = Math.min(startPoint.y, event.clientY)
      element.style.left = `${pointTopLeft.x}px`
      element.style.top = `${pointTopLeft.y}px`
      element.style.width = `${pointBottomRight.x - pointTopLeft.x}px`
      element.style.height = `${pointBottomRight.y - pointTopLeft.y}px`
    }

    function onSelectOver() {
      if (downed()) {
        if (store.controls) (store.controls as any).enabled = oldControlsEnabled
        store.setEvents({ enabled: oldRaycasterEnabled })
        element.parentElement?.removeChild(element)
      }
    }

    function pointerDown(event) {
      if (event.shiftKey) {
        onSelectStart(event)
        prepareRay(event, selBox.startPoint)
      }
    }

    let previous: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[] = []
    function pointerMove(event) {
      if (downed()) {
        onSelectMove(event)
        prepareRay(event, selBox.endPoint)
        const allSelected = selBox
          .select()
          .sort((o) => (o as any).uuid)
          .filter((o) => o.isMesh)
        if (!shallow(allSelected, previous)) {
          previous = allSelected
          dispatch({ object: props.filter(allSelected) })
        }
      }
    }

    function pointerUp(event) {
      if (downed()) onSelectOver()
    }

    document.addEventListener('pointerdown', pointerDown, { passive: true })
    document.addEventListener('pointermove', pointerMove, { passive: true, capture: true })
    document.addEventListener('pointerup', pointerUp, { passive: true })

    onCleanup(() => {
      document.removeEventListener('pointerdown', pointerDown)
      document.removeEventListener('pointermove', pointerMove)
      document.removeEventListener('pointerup', pointerUp)
    })
  })

  return (
    <T.Group
      ref={ref}
      onClick={onClick}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
      // s3f:   r3f does not set downed if(!props.multiple || !props.box) I wonder if this is a bug w r3f
      onPointerDown={() => down(true)}
      onPointerUp={() => down(false)}
      onPointerMissed={onPointerMissed}
      {...rest}
    >
      <context.Provider value={active}>{props.children}</context.Provider>
    </T.Group>
  )
}

export function useSelect() {
  return useContext(context)
}
