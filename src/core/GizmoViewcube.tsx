import { T, ThreeEvent, useThree } from '@solid-three/fiber'
import { For, Index, createMemo, createSignal, onMount, type JSX } from 'solid-js'
import { CanvasTexture, Vector3 } from 'three'
import { defaultProps } from '../helpers/defaultProps'
import { useGizmoContext } from './GizmoHelper'

type XYZ = [number, number, number]
type GenericProps = {
  font?: string
  opacity?: number
  color?: string
  hoverColor?: string
  textColor?: string
  strokeColor?: string
  onClick?: (e: ThreeEvent<MouseEvent>) => null
  faces?: string[]
}
type FaceTypeProps = { hover: boolean; index: number } & GenericProps
type EdgeCubeProps = { dimensions: XYZ; position: Vector3 } & Omit<GenericProps, 'font' & 'color'>

const colors = { bg: '#f0f0f0', hover: '#999', text: 'black', stroke: 'black' }
const defaultFaces = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back']
const makePositionVector = (xyz: number[]) => new Vector3(...xyz).multiplyScalar(0.38)

const corners: Vector3[] = [
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [1, -1, -1],
  [-1, 1, 1],
  [-1, 1, -1],
  [-1, -1, 1],
  [-1, -1, -1],
].map(makePositionVector)

const cornerDimensions: XYZ = [0.25, 0.25, 0.25]

const edges: Vector3[] = [
  [1, 1, 0],
  [1, 0, 1],
  [1, 0, -1],
  [1, -1, 0],
  [0, 1, 1],
  [0, 1, -1],
  [0, -1, 1],
  [0, -1, -1],
  [-1, 1, 0],
  [-1, 0, 1],
  [-1, 0, -1],
  [-1, -1, 0],
].map(makePositionVector)

const edgeDimensions = edges.map(
  (edge) => edge.toArray().map((axis: number): number => (axis == 0 ? 0.5 : 0.25)) as XYZ
)

const FaceMaterial = (_props: FaceTypeProps) => {
  const props = defaultProps(_props, {
    font: '20px Inter var, Arial, sans-serif',
    faces: defaultFaces,
    color: colors.bg,
    hoverColor: colors.hover,
    textColor: colors.text,
    strokeColor: colors.stroke,
    opacity: 1,
  })

  const store = useThree()
  const texture = createMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')!
    context.fillStyle = props.color
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = props.strokeColor
    context.strokeRect(0, 0, canvas.width, canvas.height)
    context.font = props.font
    context.textAlign = 'center'
    context.fillStyle = props.textColor
    context.fillText(props.faces[props.index].toUpperCase(), 64, 76)
    return new CanvasTexture(canvas)
  })

  return (
    <T.MeshBasicMaterial
      map={texture()}
      map-anisotropy={store.gl.capabilities.getMaxAnisotropy() || 1}
      attach={`material-${props.index}`}
      color={props.hover ? props.hoverColor : 'white'}
      transparent
      opacity={props.opacity}
    />
  )
}

const FaceCube = (props: GenericProps) => {
  const { tweenCamera } = useGizmoContext()

  const [hover, setHover] = createSignal<number | null>(null)
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHover(null)
  }
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    tweenCamera(e.face!.normal)
  }
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHover(Math.floor(e.faceIndex! / 2))
  }
  return (
    <T.Mesh onPointerOut={handlePointerOut} onPointerMove={handlePointerMove} onClick={props.onClick || handleClick}>
      <Index each={[...Array(6)]}>
        {(_, index) => <FaceMaterial index={index} hover={hover() === index} {...props} />}
      </Index>
      <T.BoxGeometry />
    </T.Mesh>
  )
}

const EdgeCube = ({ onClick, dimensions, position, hoverColor = colors.hover }: EdgeCubeProps): JSX.Element => {
  const { tweenCamera } = useGizmoContext()
  const [hover, setHover] = createSignal<boolean>(false)
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHover(false)
  }
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHover(true)
  }
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    tweenCamera(position)
  }
  return (
    <T.Mesh
      scale={1.01}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={onClick || handleClick}
    >
      <T.MeshBasicMaterial color={hover() ? hoverColor : 'white'} transparent opacity={0.6} visible={hover()} />
      <T.BoxGeometry args={dimensions} />
    </T.Mesh>
  )
}

export const GizmoViewcube = (props: GenericProps) => {
  onMount(() => console.log('mount this doogie'))
  return (
    <T.Group scale={[60, 60, 60]}>
      <FaceCube {...props} />
      <For each={edges}>
        {(edge, index) => <EdgeCube position={edge} dimensions={edgeDimensions[index()]} {...props} />}
      </For>
      <For each={corners}>{(corner) => <EdgeCube position={corner} dimensions={cornerDimensions} {...props} />}</For>
    </T.Group>
  )
}
