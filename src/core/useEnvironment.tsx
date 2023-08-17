import { useLoader } from '@solid-three/fiber'
import { createMemo, createRenderEffect, createResource } from 'solid-js'
import {
  CubeReflectionMapping,
  CubeTexture,
  CubeTextureLoader,
  DataTexture,
  EquirectangularReflectionMapping,
  Loader,
  TextureEncoding,
} from 'three'
import { EXRLoader, RGBELoader } from 'three-stdlib'
import { defaultProps } from '../helpers/defaultProps'
import { PresetsType, presetsObj } from '../helpers/environment-assets'
import { when } from '../helpers/when'

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/'
const isArray = (arr: any): arr is string[] => Array.isArray(arr)

export type EnvironmentLoaderProps = {
  files?: string | string[]
  path?: string
  preset?: PresetsType
  extensions?: (loader: Loader) => void
  encoding?: TextureEncoding
}

export function useEnvironment(_props: Partial<EnvironmentLoaderProps> = {}) {
  const props = defaultProps(_props, {
    files: ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'],
    path: '',
  })

  const memo = createMemo(() => {
    let files = props.files
    let path = props.path
    if (props.preset) {
      if (!(props.preset in presetsObj)) throw new Error('Preset must be one of: ' + Object.keys(presetsObj).join(', '))
      files = presetsObj[props.preset]
      path = CUBEMAP_ROOT
    }

    // Everything else
    const isCubeMap = isArray(files)
    const extension = isArray(files)
      ? 'cube'
      : files.startsWith('data:application/exr')
      ? 'exr'
      : files.startsWith('data:application/hdr')
      ? 'hdr'
      : files.split('.').pop()?.toLowerCase()

    const loader = isCubeMap
      ? CubeTextureLoader
      : extension === 'hdr'
      ? RGBELoader
      : extension === 'exr'
      ? EXRLoader
      : null
    return { files, path, isCubeMap, extension, loader }
  })

  const sRGBEncoding = 3001
  const LinearEncoding = 3000

  const texture = createResource(
    memo,
    ({ loader, files, path, isCubeMap }) =>
      new Promise<CubeTexture | DataTexture | (CubeTexture | DataTexture)[]>((resolve) => {
        if (!loader) throw new Error('useEnvironment: Unrecognized file extension: ' + files)

        const resource = useLoader(
          loader,
          () => (isCubeMap ? [files] : files),
          (loader) => {
            loader.setPath?.(path)
            if (props.extensions) props.extensions(loader)
          }
        )

        createRenderEffect(() =>
          when(resource)((_texture) => {
            const texture = isCubeMap ? _texture[0] : _texture
            texture.mapping = isCubeMap ? CubeReflectionMapping : EquirectangularReflectionMapping
            if ('colorSpace' in texture)
              (texture as any).colorSpace = props.encoding ?? isCubeMap ? 'srgb' : 'srgb-linear'
            else (texture as any).encoding = props.encoding ?? isCubeMap ? sRGBEncoding : LinearEncoding
            resolve(texture)
          })
        )
      })
  )[0]

  return texture
}
