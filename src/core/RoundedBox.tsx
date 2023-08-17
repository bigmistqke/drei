import { T, type ThreeProps } from '@solid-three/fiber'
import { createMemo, createRenderEffect } from 'solid-js'
import { ExtrudeGeometry, Mesh, Shape } from 'three'
import { toCreasedNormals } from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { NamedArrayTuple } from '../helpers/ts-utils'
import { RefComponent } from '../helpers/typeHelpers'

const eps = 0.00001

function createShape(width: number, height: number, radius0: number) {
  const shape = new Shape()
  const radius = radius0 - eps
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true)
  shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true)
  shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true)
  shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true)
  return shape
}

type Props = {
  args?: NamedArrayTuple<(width?: number, height?: number, depth?: number) => void>
  radius?: number
  smoothness?: number
  steps?: number
  creaseAngle?: number
} & Omit<ThreeProps<'Mesh'>, 'args'>

export const RoundedBox: RefComponent<Mesh, Props> = function RoundedBox(_props) {
  const [props, rest] = processProps(
    _props,
    {
      args: [],
      radius: 0.05,
      steps: 1,
      smoothness: 4,
      creaseAngle: 0.4,
    },
    ['args', 'radius', 'steps', 'smoothness', 'creaseAngle', 'children']
  )

  const memo = () => {
    const [width = 1, height = 1, depth = 1] = props.args
    return { width, height, depth }
  }

  const shape = createMemo(() => createShape(memo().width, memo().height, props.radius))
  const params = createMemo(() => ({
    depth: memo().depth - props.radius * 2,
    bevelEnabled: true,
    bevelSegments: props.smoothness * 2,
    steps: props.steps,
    bevelSize: props.radius - eps,
    bevelThickness: props.radius,
    curveSegments: props.smoothness,
  }))
  let geomRef: ExtrudeGeometry

  createRenderEffect(() => {
    if (geomRef) {
      geomRef.center()
      toCreasedNormals(geomRef, props.creaseAngle)
    }
  })

  return (
    <T.Mesh {...rest}>
      <T.ExtrudeGeometry ref={geomRef!} args={[shape(), params()]} />
      {props.children}
    </T.Mesh>
  )
}
