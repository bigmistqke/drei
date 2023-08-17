import { T, ThreeProps, extend, type Node } from '@solid-three/fiber'
import { JSXElement, Show, createEffect, createMemo, mergeProps, splitProps } from 'solid-js'
import * as THREE from 'three'
import { TextGeometry, TextGeometryParameters, mergeVertices } from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { resolveAccessor } from '../helpers/resolveAccessor'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'
import { FontData, useFont } from './useFont'

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      RenamedTextGeometry: Node<any>
    }
  }
}

type Text3DProps = {
  font: FontData | string
  bevelSegments?: number
  smooth?: number
} & Omit<TextGeometryParameters, 'font'> &
  ThreeProps<'Mesh'>

const types = ['string', 'number']
const getTextFromChildren = (children) => {
  let label = ''
  const rest: JSXElement[] = []
  children.map(resolveAccessor).forEach((child) => {
    if (types.includes(typeof child)) label += child + ''
    else rest.push(child)
  })
  return {
    label,
    rest,
  }
}

extend({ RenamedTextGeometry: TextGeometry })

export const Text3D: RefComponent<THREE.Mesh, Text3DProps & { letterSpacing?: number; lineHeight?: number }> = (
  _props
) => {
  const [props, rest] = processProps(
    _props,
    {
      letterSpacing: 0,
      lineHeight: 1,
      size: 1,
      height: 0.2,
      bevelThickness: 0.1,
      bevelSize: 0.01,
      bevelEnabled: false,
      bevelOffset: 0,
      bevelSegments: 4,
      curveSegments: 8,
    },
    [
      'ref',
      'children',
      'font',
      'smooth',
      'letterSpacing',
      'lineHeight',
      'size',
      'height',
      'bevelThickness',
      'bevelSize',
      'bevelEnabled',
      'bevelOffset',
      'bevelSegments',
      'curveSegments',
    ]
  )

  let ref: THREE.Mesh
  const font = useFont(props.font)

  const fontProps = splitProps(props, ['font'])[1]
  const opts = mergeProps(
    {
      get font() {
        return font()
      },
    },
    fontProps
  )

  const memo = createMemo(() => getTextFromChildren(props.children))
  const args = createMemo(() => [memo().label, opts])

  createEffect(() => {
    if (props.smooth) {
      ref.geometry = mergeVertices(ref.geometry, props.smooth)
      ref.geometry.computeVertexNormals()
    }
  })

  createImperativeHandle(props, () => ref)

  return (
    <T.Mesh {...rest} ref={ref!}>
      <Show when={opts.font}>
        <T.RenamedTextGeometry args={args()} />
      </Show>
      {memo().rest}
    </T.Mesh>
  )
}
