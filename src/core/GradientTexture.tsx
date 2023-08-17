import { ThreeProps, useThree } from '@solid-three/fiber'
import { createMemo } from 'solid-js'
import { processProps } from '../helpers/processProps'
export enum GradientType {
  Linear = 'linear',
  Radial = 'radial',
}

type Props = {
  stops: Array<number>
  colors: Array<string>
  attach?: string
  size?: number
  width?: number
  type?: GradientType
  innerCircleRadius?: number
  outerCircleRadius?: string | number
} & ThreeProps<'Texture'>

export function GradientTexture(_props: Props) {
  const [props, rest] = processProps(
    _props,
    {
      size: 1024,
      width: 16,
      //@ts-ignore - weird error about type never, although the type is clearly defined
      type: GradientType.Linear,
      innerCircleRadius: 0,
      outerCircleRadius: 'auto',
    },
    ['size', 'width', 'type', 'innerCircleRadius', 'outerCircleRadius']
  )

  const store = useThree()
  const canvas = createMemo(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = props.width
    canvas.height = props.size
    let gradient
    if (props.type === GradientType.Linear) {
      gradient = context.createLinearGradient(0, 0, 0, props.size)
    } else {
      const canvasCenterX = canvas.width / 2
      const canvasCenterY = canvas.height / 2
      const radius =
        props.outerCircleRadius !== 'auto'
          ? Math.abs(Number(props.outerCircleRadius))
          : Math.sqrt(canvasCenterX ** 2 + canvasCenterY ** 2)
      gradient = context.createRadialGradient(
        canvasCenterX,
        canvasCenterY,
        Math.abs(props.innerCircleRadius),
        canvasCenterX,
        canvasCenterY,
        radius
      )
    }

    let i = props.stops.length
    while (i--) {
      gradient.addColorStop(props.stops[i], props.colors[i])
    }
    context.save()
    context.fillStyle = gradient
    context.fillRect(0, 0, props.width, props.size)
    context.restore()

    return canvas
  })

  // @ts-ignore ????
  return <T.CanvasTexture colorSpace={store.gl.outputColorSpace} args={[canvas()]} attach="map" {...rest} />
}
