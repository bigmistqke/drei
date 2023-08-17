import { useThree } from '@solid-three/fiber'
import { Accessor, createRenderEffect, onCleanup } from 'solid-js'
import * as THREE from 'three'

type FBOSettings = {
  /** Defines the count of MSAA samples. Can only be used with WebGL 2. Default: 0 */
  samples?: number
  /** If set, the scene depth will be rendered into buffer.depthTexture. Default: false */
  depth?: boolean
} & THREE.WebGLRenderTargetOptions

// 👇 uncomment when TS version supports function overloads
// export function useFBO(settings?: FBOSettings)
export function useFBO(
  /** Width in pixels, or settings (will render fullscreen by default) */
  width?: Accessor<number> | number | FBOSettings,
  /** Height in pixels */
  height?: Accessor<number> | number,
  /**Settings */
  settings?: FBOSettings
): THREE.WebGLRenderTarget {
  const store = useThree()

  const _width = () =>
    typeof width === 'number' ? width : typeof width === 'function' ? width() : store.size.width * store.viewport.dpr
  const _height = () =>
    typeof height === 'number'
      ? height
      : typeof height === 'function'
      ? height()
      : store.size?.height && store.viewport?.dpr
      ? store.size.height * store.viewport.dpr
      : 0

  const _settings = () => (typeof settings !== 'undefined' ? settings : (width as FBOSettings)) || {}

  const { samples = 0, depth, ...targetSettings } = _settings()

  const target = new THREE.WebGLRenderTarget(_width(), _height(), {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
    ...targetSettings,
  })

  if (depth) {
    target.depthTexture = new THREE.DepthTexture(_width(), _height(), THREE.FloatType)
  }

  target.samples = samples

  createRenderEffect(() => {
    target.setSize(_width(), _height())
    if (samples) target.samples = samples
  })
  onCleanup(() => {
    target.dispose
  })
  return target
}
