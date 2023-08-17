import { Object3DNode } from '@solid-three/fiber'
import { createEffect, createMemo } from 'solid-js'
import { QuadraticBezierCurve3, Vector3 } from 'three'
import { Line2 } from 'three-stdlib'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { Line, LineProps } from './Line'

type Props = Omit<LineProps, 'points' | 'ref' | 'segments'> & {
  start: Vector3 | [number, number, number]
  end: Vector3 | [number, number, number]
  mid?: Vector3 | [number, number, number]
  segments?: number
}

type Line2Props = Object3DNode<Line2> & {
  setPoints: (
    start: Vector3 | [number, number, number],
    end: Vector3 | [number, number, number],
    mid: Vector3 | [number, number, number]
  ) => void
}

const v = new Vector3()
export const QuadraticBezierLine: RefComponent<Line2Props, Props> = function QuadraticBezierLine(_props) {
  const [props, rest] = processProps(
    _props,
    {
      start: [0, 0, 0],
      end: [0, 0, 0],
      segments: 20,
    },
    ['ref', 'start', 'end', 'mid', 'segments']
  )

  const lineRef = createRef<Line2Props>(null!)
  const curve = new QuadraticBezierCurve3(undefined as any, undefined as any, undefined as any)
  const getPoints = (start, end, mid, segments = 20) => {
    if (start instanceof Vector3) curve.v0.copy(start)
    else curve.v0.set(...(start as [number, number, number]))
    if (end instanceof Vector3) curve.v2.copy(end)
    else curve.v2.set(...(end as [number, number, number]))
    if (mid instanceof Vector3) {
      curve.v1.copy(mid)
    } else if (Array.isArray(mid)) {
      curve.v1.set(...(mid as [number, number, number]))
    } else {
      curve.v1.copy(
        curve.v0
          .clone()
          .add(curve.v2.clone().sub(curve.v0))
          .add(v.set(0, curve.v0.y - curve.v2.y, 0))
      )
    }
    return curve.getPoints(segments)
  }

  createEffect(() => {
    lineRef.ref.setPoints = (
      start: Vector3 | [number, number, number],
      end: Vector3 | [number, number, number],
      mid: Vector3 | [number, number, number]
    ) => {
      const points = getPoints(start, end, mid)
      if (lineRef.ref.geometry) lineRef.ref.geometry.setPositions(points.map((p) => p.toArray()).flat())
    }
  })

  const points = createMemo(
    () => getPoints(props.start, props.end, props.mid, props.segments),
    [props.start, props.end, props.mid, props.segments]
  )
  // s3f:   ref is Line2Props? idgi.
  return <Line ref={mergeRefs(lineRef, props)} points={points()} {...rest} />
}
