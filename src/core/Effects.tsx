import { SolidThreeFiber, T, extend, useFrame, useThree } from '@solid-three/fiber'
import { createEffect, createMemo, type JSX } from 'solid-js'
import { HalfFloatType, RGBAFormat, UnsignedByteType, WebGLRenderTarget } from 'three'
import { EffectComposer, GammaCorrectionShader, RenderPass, ShaderPass } from 'three-stdlib'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

type Props = SolidThreeFiber.Node<EffectComposer> & {
  multisamping?: number
  encoding?: number
  type?: number
  renderIndex?: number
  disableGamma?: boolean
  disableRenderPass?: boolean
  disableRender?: boolean
  depthBuffer?: boolean
  stencilBuffer?: boolean
  anisotropy?: number
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      EffectComposer: SolidThreeFiber.Node<EffectComposer>
      RenderPass: SolidThreeFiber.Node<RenderPass>
      ShaderPass: SolidThreeFiber.Node<ShaderPass>
    }
  }
}

export const isWebGL2Available = () => {
  try {
    var canvas = document.createElement('canvas')
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'))
  } catch (e) {
    return false
  }
}

export const Effects: RefComponent<any, Props, true> = (_props: Props) => {
  const [props, rest] = processProps(
    _props,
    {
      multisamping: 8,
      renderIndex: 1,
      depthBuffer: true,
      stencilBuffer: false,
      anisotropy: 1,
    },
    [
      'ref',
      'children',
      'multisamping',
      'renderIndex',
      'disableRender',
      'disableGamma',
      'disableRenderPass',
      'depthBuffer',
      'stencilBuffer',
      'anisotropy',
      'encoding',
      'type',
    ]
  )

  createMemo(() => extend({ EffectComposer, RenderPass, ShaderPass }))

  const composer = createRef<EffectComposer>(null!)
  const store = useThree()
  const target = (() => {
    const t = new WebGLRenderTarget(store.size.width, store.size.height, {
      type: props.type || HalfFloatType,
      format: RGBAFormat,
      depthBuffer: props.depthBuffer,
      stencilBuffer: props.stencilBuffer,
      anisotropy: props.anisotropy,
    })

    // sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
    if (props.type === UnsignedByteType && props.encoding != null) {
      if ('colorSpace' in t) (t.texture as any).colorSpace = props.encoding
      else t.texture.encoding = props.encoding
    }

    t.samples = props.multisamping
    return t
  })()

  createEffect(() => {
    composer.ref.setSize(store.size.width, store.size.height)
    composer.ref.setPixelRatio(store.viewport.dpr)
  })

  useFrame(() => {
    if (!props.disableRender) composer.ref.render()
  }, props.renderIndex)

  const passes: JSX.Element[] = []
  if (!props.disableRenderPass)
    passes.push(<T.RenderPass key="renderpass" attach={`passes-${passes.length}`} args={[store.scene, store.camera]} />)
  if (!props.disableGamma)
    passes.push(<T.ShaderPass attach={`passes-${passes.length}`} key="gammapass" args={[GammaCorrectionShader]} />)

  createEffect(() => {
    if (!props.children) return
    const children = Array.isArray(props.children) ? props.children : [props.children]
    children.forEach((el: any) => {
      // s3f    solid can not cloneElement
      el && passes.push(React.cloneElement(el, { key: passes.length, attach: `passes-${passes.length}` }))
    })
  })

  return (
    <T.EffectComposer ref={mergeRefs(props, composer)} args={[store.gl, target]} {...rest}>
      {passes}
    </T.EffectComposer>
  )
}
