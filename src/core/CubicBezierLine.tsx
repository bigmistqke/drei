import { createMemo } from 'solid-js'
import { CubicBezierCurve3, Vector3 } from 'three'
import { Line2 } from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { Line, LineProps } from './Line'

type Props = Omit<LineProps, 'points' | 'ref' | 'segments'> & {
  start: Vector3 | [number, number, number]
  end: Vector3 | [number, number, number]
  midA: Vector3 | [number, number, number]
  midB: Vector3 | [number, number, number]
  segments?: number
}

export const CubicBezierLine: RefComponent<Line2, Props> = function CubicBezierLine(_props) {
  const [props, rest] = processProps(_props, { segments: 20 }, ['ref', 'start', 'end', 'midA', 'midB', 'segments'])

  const points = createMemo(() => {
    const startV = props.start instanceof Vector3 ? props.start : new Vector3(...props.start)
    const endV = props.end instanceof Vector3 ? props.end : new Vector3(...props.end)
    const midAV = props.midA instanceof Vector3 ? props.midA : new Vector3(...props.midA)
    const midBV = props.midB instanceof Vector3 ? props.midB : new Vector3(...props.midB)
    const interpolatedV = new CubicBezierCurve3(startV, midAV, midBV, endV).getPoints(props.segments)
    return interpolatedV
  })

  return <Line ref={props.ref as any} points={points()} {...rest} />
}
