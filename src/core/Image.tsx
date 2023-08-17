import { Color, T, ThreeProps, extend } from '@solid-three/fiber'
import { JSXElement, Show, createMemo, splitProps } from 'solid-js'
import * as THREE from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { shaderMaterial } from './shaderMaterial'
import { useTexture } from './useTexture'

export type ImageProps = Omit<ThreeProps<'Mesh'>, 'scale'> & {
  segments?: number
  scale?: number | [number, number]
  color?: Color
  zoom?: number
  grayscale?: number
  toneMapped?: boolean
  transparent?: boolean
  opacity?: number
} & ({ texture: THREE.Texture; url?: never } | { texture?: never; url: string }) // {texture: THREE.Texture} XOR {url: string}

type ImageMaterialType = ThreeProps<'ShaderMaterial'> & {
  scale?: number[]
  imageBounds?: number[]
  color?: Color
  map: THREE.Texture
  zoom?: number
  grayscale?: number
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      ImageMaterial: ImageMaterialType
    }
  }
}

const ImageMaterialImpl = shaderMaterial(
  { color: new THREE.Color('white'), scale: [1, 1], imageBounds: [1, 1], map: null, zoom: 1, grayscale: 0, opacity: 1 },
  /* glsl */ `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
    vUv = uv;
  }
`,
  /* glsl */ `
  // mostly from https://gist.github.com/statico/df64c5d167362ecf7b34fca0b1459a44
  varying vec2 vUv;
  uniform vec2 scale;
  uniform vec2 imageBounds;
  uniform vec3 color;
  uniform sampler2D map;
  uniform float zoom;
  uniform float grayscale;
  uniform float opacity;
  const vec3 luma = vec3(.299, 0.587, 0.114);
  vec4 toGrayscale(vec4 color, float intensity) {
    return vec4(mix(color.rgb, vec3(dot(color.rgb, luma)), intensity), color.a);
  }
  vec2 aspect(vec2 size) {
    return size / min(size.x, size.y);
  }
  void main() {
    vec2 s = aspect(scale);
    vec2 i = aspect(imageBounds);
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = vUv * s / new + offset;
    vec2 zUv = (uv - vec2(0.5, 0.5)) / zoom + vec2(0.5, 0.5);
    gl_FragColor = toGrayscale(texture2D(map, zUv) * vec4(color, opacity), grayscale);
    
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }
`
)

const ImageBase: RefComponent<THREE.Mesh, Omit<ImageProps, 'url'>, true> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      segments: 1,
      scale: 1,
      zoom: 1,
      grayscale: 0,
      opacity: 1,
    },
    [
      'ref',
      'children',
      'color',
      'segments',
      'scale',
      'zoom',
      'grayscale',
      'opacity',
      'texture',
      'toneMapped',
      'transparent',
    ]
  )

  extend({ ImageMaterial: ImageMaterialImpl })

  const planeBounds = () => (Array.isArray(props.scale) ? [props.scale[0], props.scale[1]] : [props.scale, props.scale])
  const imageBounds = () => [props.texture?.image.width, props.texture?.image.height]
  return (
    <T.Mesh
      ref={props.ref}
      scale={Array.isArray(props.scale) ? [...(props.scale as [number, number]), 1] : props.scale}
      {...rest}
    >
      <T.PlaneGeometry args={[1, 1, props.segments, props.segments]} />
      <T.ImageMaterial
        color={props.color}
        map={props.texture!}
        zoom={props.zoom}
        grayscale={props.grayscale}
        opacity={props.opacity}
        scale={planeBounds()}
        imageBounds={imageBounds()}
        toneMapped={props.toneMapped}
        transparent={props.transparent}
      />
      {props.children}
    </T.Mesh>
  )
}

const ImageWithUrl: RefComponent<THREE.Mesh, ImageProps> = (_props) => {
  const [props, rest] = splitProps(_props, ['url'])
  const texture = useTexture(props.url!)
  return (
    <Show when={texture()}>
      <ImageBase {...rest} texture={texture()} />
    </Show>
  )
}

const ImageWithTexture: RefComponent<THREE.Mesh, ImageProps> = (_props) => {
  const [, rest] = splitProps(_props, ['url'])
  return <ImageBase {...rest} />
}

export const Image: RefComponent<THREE.Mesh, ImageProps> = (props) => {
  const memo = createMemo(() => {
    if (props.url) return <ImageWithUrl {...props} />
    else if (props.texture) return <ImageWithTexture {...props} />
    else console.error('<Image /> requires a url or texture')
  })
  return memo as unknown as JSXElement
}
