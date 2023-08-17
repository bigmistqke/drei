import { T, ThreeProps } from '@solid-three/fiber'
import { createMemo, onMount } from 'solid-js'
import { Color, DoubleSide } from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

type Props = ThreeProps<'Mesh'> & {
  colorStop?: number
  fog?: boolean
  color?: Color | number | string
  opacity?: number
  depthWrite?: boolean
}

export const Shadow: RefComponent<THREE.Mesh, Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    { fog: false, depthWrite: false, colorStop: 0.0, color: 'black', opacity: 0.5 },
    ['ref', 'fog', 'renderOrder', 'depthWrite', 'colorStop', 'color', 'opacity']
  )

  const canvas = createMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const gradient = context.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    )
    gradient.addColorStop(props.colorStop, new Color(props.color).getStyle())
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    return canvas
  })

  let mat
  onMount(() => {
    mat.needsUpdate = true
  })
  return (
    <T.Mesh renderOrder={props.renderOrder} ref={props.ref} rotation-x={-Math.PI / 2} {...rest}>
      <T.PlaneGeometry />
      <T.MeshBasicMaterial
        transparent={true}
        opacity={props.opacity}
        fog={props.fog}
        depthWrite={props.depthWrite}
        side={DoubleSide}
        ref={mat}
      >
        <T.CanvasTexture attach="map" args={[canvas()]} />
      </T.MeshBasicMaterial>
    </T.Mesh>
  )
}
