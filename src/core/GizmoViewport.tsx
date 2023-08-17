import { T, ThreeEvent, ThreeProps, useThree } from '@solid-three/fiber'
import { createMemo, createSignal } from 'solid-js'
import { CanvasTexture } from 'three'
import { defaultProps } from '../helpers/defaultProps'
import { processProps } from '../helpers/processProps'
import { useGizmoContext } from './GizmoHelper'

type AxisProps = {
  color: string
  rotation: [number, number, number]
  scale?: [number, number, number]
}

type AxisHeadProps = ThreeProps<'Sprite'> & {
  arcStyle: string
  label?: string
  labelColor: string
  axisHeadScale?: number
  disabled?: boolean
  font: string
  onClick?: (e: ThreeEvent<MouseEvent>) => null
}

type GizmoViewportProps = ThreeProps<'Sprite'> & {
  axisColors?: [string, string, string]
  axisScale?: [number, number, number]
  labels?: [string, string, string]
  axisHeadScale?: number
  labelColor?: string
  hideNegativeAxes?: boolean
  hideAxisHeads?: boolean
  disabled?: boolean
  font?: string
  onClick?: (e: ThreeEvent<MouseEvent>) => null
}

function Axis(_props: AxisProps) {
  const props = defaultProps(_props, {
    scale: [0.8, 0.05, 0.05],
  })
  return (
    <T.Group rotation={props.rotation}>
      <T.Mesh position={[0.4, 0, 0]}>
        <T.BoxGeometry args={props.scale} />
        <T.MeshBasicMaterial color={props.color} toneMapped={false} />
      </T.Mesh>
    </T.Group>
  )
}

function AxisHead(_props: AxisHeadProps) {
  const [props, rest] = processProps(
    _props,
    {
      axisHeadScale: 1,
    },
    ['onClick', 'font', 'disabled', 'arcStyle', 'label', 'labelColor', 'axisHeadScale']
  )

  const store = useThree()
  const texture = createMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64

    const context = canvas.getContext('2d')!
    context.beginPath()
    context.arc(32, 32, 16, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = props.arcStyle
    context.fill()

    if (props.label) {
      context.font = props.font
      context.textAlign = 'center'
      context.fillStyle = props.labelColor
      context.fillText(props.label, 32, 41)
    }
    return new CanvasTexture(canvas)
  })

  const [active, setActive] = createSignal(false)
  const scale = () => (props.label ? 1 : 0.75) * (active() ? 1.2 : 1) * props.axisHeadScale
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setActive(true)
  }
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setActive(false)
  }
  return (
    <T.Sprite
      scale={scale()}
      onPointerOver={!props.disabled ? handlePointerOver : undefined}
      onPointerOut={!props.disabled ? props.onClick || handlePointerOut : undefined}
      {...rest}
    >
      <T.SpriteMaterial
        map={texture()}
        map-anisotropy={store.gl.capabilities.getMaxAnisotropy() || 1}
        alphaTest={0.3}
        opacity={props.label ? 1 : 0.75}
        toneMapped={false}
      />
    </T.Sprite>
  )
}

export const GizmoViewport = (_props: GizmoViewportProps) => {
  const [props, rest] = processProps(
    _props,
    {
      font: '18px Inter var, Arial, sans-serif',
      axisColors: ['#ff2060', '#20df80', '#2080ff'],
      axisHeadScale: 1,
      labels: ['X', 'Y', 'Z'],
      labelColor: '#000',
    },
    [
      'hideNegativeAxes',
      'hideAxisHeads',
      'disabled',
      'font',
      'axisColors',
      'axisHeadScale',
      'axisScale',
      'labels',
      'labelColor',
      'onClick',
    ]
  )

  const { tweenCamera } = useGizmoContext()
  const axisHeadProps = {
    font: props.font,
    disabled: props.disabled,
    labelColor: props.labelColor,
    onClick: props.onClick,
    axisHeadScale: props.axisHeadScale,
    onPointerDown: !props.disabled
      ? (e: ThreeEvent<PointerEvent>) => {
          tweenCamera(e.object.position)
          e.stopPropagation()
        }
      : undefined,
  }
  return (
    <T.Group scale={40} {...rest}>
      <Axis color={props.axisColors[0]} rotation={[0, 0, 0]} scale={props.axisScale} />
      <Axis color={props.axisColors[1]} rotation={[0, 0, Math.PI / 2]} scale={props.axisScale} />
      <Axis color={props.axisColors[2]} rotation={[0, -Math.PI / 2, 0]} scale={props.axisScale} />
      {!props.hideAxisHeads && (
        <>
          <AxisHead arcStyle={props.axisColors[0]} position={[1, 0, 0]} label={props.labels[0]} {...axisHeadProps} />
          <AxisHead arcStyle={props.axisColors[1]} position={[0, 1, 0]} label={props.labels[1]} {...axisHeadProps} />
          <AxisHead arcStyle={props.axisColors[2]} position={[0, 0, 1]} label={props.labels[2]} {...axisHeadProps} />
          {!props.hideNegativeAxes && (
            <>
              <AxisHead arcStyle={props.axisColors[0]} position={[-1, 0, 0]} {...axisHeadProps} />
              <AxisHead arcStyle={props.axisColors[1]} position={[0, -1, 0]} {...axisHeadProps} />
              <AxisHead arcStyle={props.axisColors[2]} position={[0, 0, -1]} {...axisHeadProps} />
            </>
          )}
        </>
      )}
    </T.Group>
  )
}
