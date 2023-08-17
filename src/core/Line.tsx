import { Primitive, SolidThreeFiber, useThree } from '@solid-three/fiber'
import { createMemo, createRenderEffect, on, onCleanup } from 'solid-js'
import { Color, ColorRepresentation, Vector2, Vector3 } from 'three'
import {
  Line2,
  LineGeometry,
  LineMaterial,
  LineMaterialParameters,
  LineSegments2,
  LineSegmentsGeometry,
} from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { all } from '../helpers/when'

export type LineProps = {
  points: Array<Vector3 | Vector2 | [number, number, number] | [number, number] | number>
  vertexColors?: Array<Color | [number, number, number]>
  lineWidth?: number
  segments?: boolean
} & Omit<LineMaterialParameters, 'vertexColors' | 'color'> &
  Omit<SolidThreeFiber.Object3DNode<Line2>, 'args'> &
  Omit<SolidThreeFiber.Object3DNode<LineMaterial>, 'color' | 'vertexColors' | 'args'> & {
    color?: ColorRepresentation
  }

export const Line: RefComponent<Line2 | LineSegments2, LineProps> = function Line(_props) {
  const [props, rest] = processProps(_props, { color: 'black' }, [
    'ref',
    'points',
    'color',
    'vertexColors',
    'linewidth',
    'lineWidth',
    'segments',
    'dashed',
  ])

  const store = useThree()
  const line2 = createMemo(() => (props.segments ? new LineSegments2() : new Line2()))
  const lineMaterial = new LineMaterial()
  const lineGeom = createMemo(() => {
    const geom = props.segments ? new LineSegmentsGeometry() : new LineGeometry()
    const pValues = props.points.map((p) => {
      const isArray = Array.isArray(p)
      return p instanceof Vector3
        ? [p.x, p.y, p.z]
        : p instanceof Vector2
        ? [p.x, p.y, 0]
        : isArray && p.length === 3
        ? [p[0], p[1], p[2]]
        : isArray && p.length === 2
        ? [p[0], p[1], 0]
        : p
    })

    geom.setPositions(pValues.flat())

    if (props.vertexColors) {
      const cValues = props.vertexColors.map((c) => (c instanceof Color ? c.toArray() : c))
      geom.setColors(cValues.flat())
    }

    return geom
  })

  createRenderEffect(
    on(
      () => all(props.points, line2),
      (props) => {
        if (!props) return
        const [points, line] = props

        // line2().computeLineDistances()
      }
    )
  )

  createRenderEffect(() => {
    if (props.dashed) {
      lineMaterial.defines.USE_DASH = ''
    } else {
      // Setting lineMaterial.defines.USE_DASH to undefined is apparently not sufficient.
      delete lineMaterial.defines.USE_DASH
    }
    lineMaterial.needsUpdate = true
  })

  onCleanup(() => lineGeom().dispose())

  return (
    <>
      <Primitive object={line2()} ref={props.ref} {...rest}>
        <Primitive object={lineGeom()} attach="geometry" />
        <Primitive
          object={lineMaterial}
          attach="material"
          color={props.color}
          vertexColors={Boolean(props.vertexColors)}
          resolution={[store.size.width, store.size.height]}
          linewidth={props.linewidth ?? props.lineWidth}
          dashed={props.dashed}
          {...rest}
        />
      </Primitive>
    </>
  )
}
