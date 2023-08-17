import { createMemo } from 'solid-js'
import { CatmullRomCurve3, Color, Vector3 } from 'three'
import { Line2 } from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { Line, LineProps } from './Line'

type Props = Omit<LineProps, 'ref'> & {
  closed?: boolean
  curveType?: 'centripetal' | 'chordal' | 'catmullrom'
  tension?: number
  segments?: number
}

export const CatmullRomLine: RefComponent<Line2, Props> = function CatmullRomLine(_props) {
  const [props, rest] = processProps(
    _props,
    {
      closed: false,
      curveType: 'centripetal',
      tension: 0.5,
      segments: 20,
    },
    ['ref', 'points', 'closed', 'curveType', 'tension', 'segments', 'vertexColors']
  )

  const curve = createMemo(() => {
    const mappedPoints = props.points.map((pt) =>
      pt instanceof Vector3 ? pt : new Vector3(...(pt as [number, number, number]))
    )

    return new CatmullRomCurve3(mappedPoints, props.closed, props.curveType, props.tension)
  }, [props.points, props.closed, props.curveType, props.tension])

  const segmentedPoints = createMemo(() => curve().getPoints(props.segments), [curve, props.segments])

  const interpolatedVertexColors = createMemo(() => {
    if (!props.vertexColors || props.vertexColors.length < 2) return undefined

    if (props.vertexColors.length === props.segments + 1) return props.vertexColors

    const mappedColors = props.vertexColors.map((color) =>
      color instanceof Color ? color : new Color(...(color as [number, number, number]))
    )
    if (props.closed) mappedColors.push(mappedColors[0].clone())

    const iColors: Color[] = [mappedColors[0]]
    const divisions = props.segments / (mappedColors.length - 1)
    for (let i = 1; i < props.segments; i++) {
      const alpha = (i % divisions) / divisions
      const colorIndex = Math.floor(i / divisions)
      iColors.push(mappedColors[colorIndex].clone().lerp(mappedColors[colorIndex + 1], alpha))
    }
    iColors.push(mappedColors[mappedColors.length - 1])

    return iColors
  }, [props.vertexColors, props.segments])

  return <Line ref={props.ref} points={segmentedPoints()} vertexColors={interpolatedVertexColors()} {...rest} />
}
