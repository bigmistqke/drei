import { Object3DNode, Primitive, SolidThreeFiber, T, ThreeProps, extend, useFrame } from '@solid-three/fiber'
import { createContext, createSignal, onMount, useContext, type JSX } from 'solid-js'
import * as THREE from 'three'
import { Line2, LineMaterial, LineSegmentsGeometry } from 'three-stdlib'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

type SegmentsProps = {
  limit?: number
  lineWidth?: number
  children: JSX.Element
}

type Api = {
  subscribe: (ref: SegmentObject) => void
}

// type SegmentRef = React.RefObject<SegmentObject>
type SegmentProps = Omit<ThreeProps<'SegmentObject'>, 'start' | 'end' | 'color'> & {
  start: SolidThreeFiber.Vector3
  end: SolidThreeFiber.Vector3
  color?: SolidThreeFiber.Color
}

const context = createContext<Api>()

const Segments: RefComponent<Line2, SegmentsProps> = (_props) => {
  extend({ SegmentObject })

  const [props, rest] = processProps(
    _props,
    {
      limit: 1000,
      lineWidth: 1.0,
    },
    ['ref', 'limit', 'lineWidth', 'children']
  )

  const [segments, setSegments] = createSignal<Array<SegmentObject>>([])

  const line = new Line2()
  const material = new LineMaterial()
  const geometry = new LineSegmentsGeometry()
  const resolution = new THREE.Vector2(512, 512)
  const positions = Array(props.limit * 6).fill(0)
  const colors = Array(props.limit * 6).fill(0)

  const api: Api = {
    subscribe: (ref: SegmentObject) => {
      setSegments((segments) => [...segments, ref])
      return () => setSegments((segments) => segments.filter((item) => item !== ref))
    },
  }

  useFrame(() => {
    const limit = Math.min(segments().length, props.limit)
    for (let i = 0; i < limit; i++) {
      const segment = segments()[i]
      positions[i * 6 + 0] = segment.start.x
      positions[i * 6 + 1] = segment.start.y
      positions[i * 6 + 2] = segment.start.z

      positions[i * 6 + 3] = segment.end.x
      positions[i * 6 + 4] = segment.end.y
      positions[i * 6 + 5] = segment.end.z

      colors[i * 6 + 0] = segment.color.r
      colors[i * 6 + 1] = segment.color.g
      colors[i * 6 + 2] = segment.color.b

      colors[i * 6 + 3] = segment.color.r
      colors[i * 6 + 4] = segment.color.g
      colors[i * 6 + 5] = segment.color.b
    }
    geometry.setColors(colors)
    geometry.setPositions(positions)
    line.computeLineDistances()
  })

  return (
    <Primitive object={line} ref={props.ref}>
      <Primitive object={geometry} attach="geometry" />
      <Primitive
        object={material}
        attach="material"
        vertexColors={true}
        resolution={resolution}
        linewidth={props.lineWidth}
        {...rest}
      />
      <context.Provider value={api}>{props.children}</context.Provider>
    </Primitive>
  )
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      SegmentObject: Object3DNode<SegmentObject>
    }
  }
}

export class SegmentObject {
  color: THREE.Color
  start: THREE.Vector3
  end: THREE.Vector3
  constructor() {
    this.color = new THREE.Color('white')
    this.start = new THREE.Vector3(0, 0, 0)
    this.end = new THREE.Vector3(0, 0, 0)
  }
}

const normPos = (pos: SegmentProps['start']): SegmentObject['start'] =>
  pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(...(typeof pos === 'number' ? [pos, pos, pos] : pos))

const Segment: RefComponent<SegmentObject, SegmentProps> = (props) => {
  const api = useContext(context)

  if (!api) throw 'Segment must used inside Segments component.'
  const segmentRef = createRef<SegmentObject>(null!)
  onMount(() => api.subscribe(segmentRef.ref))
  return (
    <T.SegmentObject
      ref={mergeRefs(segmentRef, props)}
      color={props.color}
      start={normPos(props.start)}
      end={normPos(props.end)}
    />
  )
}

export { Segment, Segments }
