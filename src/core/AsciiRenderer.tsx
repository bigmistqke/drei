import { useFrame, useThree } from '@solid-three/fiber'
import { createEffect, createMemo, createRenderEffect, mergeProps, onCleanup } from 'solid-js'
import { AsciiEffect } from 'three-stdlib'

type AsciiRendererProps = {
  /** Render index, default: 1 */
  renderIndex?: number
  /** CSS background color (can be "transparent"), default: black */
  bgColor?: string
  /** CSS character color, default: white */
  fgColor?: string
  /** Characters, default: ' .:-+*=%@#' */
  characters?: string
  /** Invert character, default: true */
  invert?: boolean
  /** Colorize output (very expensive!), default: false */
  color?: boolean
  /** Level of detail, default: 0.15 */
  resolution?: number
}

export function AsciiRenderer(_props: AsciiRendererProps) {
  const props = mergeProps(
    {
      renderIndex: 1,
      bgColor: 'black',
      fgColor: 'white',
      characters: ' .:-+*=%@#',
      invert: true,
      color: false,
      resolution: 0.15,
    },
    _props
  )
  // Reactive state
  const store = useThree()

  // Create effect
  const effect = createMemo(() => {
    const effect = new AsciiEffect(store.gl, props.characters, {
      invert: props.invert,
      color: props.color,
      resolution: props.resolution,
    })
    effect.domElement.style.position = 'absolute'
    effect.domElement.style.top = '0px'
    effect.domElement.style.left = '0px'
    effect.domElement.style.pointerEvents = 'none'
    return effect
  })

  // Styling
  createRenderEffect(() => {
    effect().domElement.style.color = props.fgColor
    effect().domElement.style.backgroundColor = props.bgColor
  })

  // Append on mount, remove on unmount
  createEffect(() => {
    store.gl.domElement.style.opacity = '0'
    store.gl.domElement.parentNode!.appendChild(effect().domElement)
    onCleanup(() => {
      store.gl.domElement.style.opacity = '1'
      store.gl.domElement.parentNode!.removeChild(effect().domElement)
    })
  })

  // Set size
  createEffect(() => {
    effect().setSize(store.size.width, store.size.height)
  })

  // Take over render-loop (that is what the index is for)
  useFrame((state) => {
    effect().render(store.scene, store.camera)
  }, props.renderIndex)

  // return something to not break type signatures
  return <></>
}
