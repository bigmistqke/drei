import { createMemo, createRenderEffect, createResource, JSX, onCleanup } from 'solid-js'
// @ts-ignore
import { Primitive, SolidThreeFiber, ThreeProps, useThree } from '@solid-three/fiber'
// import { suspend } from 'suspend-react'
import { preloadFont, Text as TextMeshImpl } from 'troika-three-text'
import { processProps } from '../helpers/processProps'
import { resolveAccessor } from '../helpers/resolveAccessor'
import { RefComponent } from '../helpers/typeHelpers'

type Props = ThreeProps<'Mesh'> & {
  children: JSX.Element | JSX.Element[]
  characters?: string
  color?: SolidThreeFiber.Color
  /** Font size, default: 1 */
  fontSize?: number
  maxWidth?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'right' | 'center' | 'justify'
  font?: string
  anchorX?: number | 'left' | 'center' | 'right'
  anchorY?: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom'
  clipRect?: [number, number, number, number]
  depthOffset?: number
  direction?: 'auto' | 'ltr' | 'rtl'
  overflowWrap?: 'normal' | 'break-word'
  whiteSpace?: 'normal' | 'overflowWrap' | 'nowrap'
  outlineWidth?: number | string
  outlineOffsetX?: number | string
  outlineOffsetY?: number | string
  outlineBlur?: number | string
  outlineColor?: SolidThreeFiber.Color
  outlineOpacity?: number
  strokeWidth?: number | string
  strokeColor?: SolidThreeFiber.Color
  strokeOpacity?: number
  fillOpacity?: number
  sdfGlyphSize?: number
  debugSDF?: boolean
  onSync?: (troika: any) => void
}

// eslint-disable-next-line prettier/prettier
export const Text: RefComponent<any, Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      sdfGlyphSize: 64,
      anchorX: 'center',
      anchorY: 'middle',
    },
    ['sdfGlyphSize', 'anchorX', 'anchorY', 'font', 'fontSize', 'children', 'characters', 'onSync']
  )

  const store = useThree()
  const troikaMesh = new TextMeshImpl()

  const memo = createMemo(() => {
    const nodes: JSX.Element[] = []
    let text = ''

    const children = Array.isArray(props.children) ? props.children : [props.children]

    children
      .map((child) => resolveAccessor(child))
      .forEach((child) => {
        if (typeof child === 'string' || typeof child === 'number') {
          text += child
        } else {
          nodes.push(child)
        }
      })

    return { nodes, text }
  })

  // s3f    does resource cache?
  const [resource] = createResource(
    ['troika-text', props.font, props.characters],
    () => new Promise((res) => preloadFont({ font: props.font, characters: props.characters }, res))
  )

  createRenderEffect(() =>
    troikaMesh.sync(() => {
      store.invalidate()
      if (props.onSync) props.onSync(troikaMesh)
    })
  )

  onCleanup(() => troikaMesh.dispose())

  return (
    <Primitive
      object={troikaMesh}
      font={props.font}
      text={memo().text}
      anchorX={props.anchorX}
      anchorY={props.anchorY}
      fontSize={props.fontSize}
      sdfGlyphSize={props.sdfGlyphSize}
      {...rest}
    >
      {memo().nodes}
    </Primitive>
  )
}
