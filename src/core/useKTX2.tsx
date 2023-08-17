import { useLoader, useThree } from '@solid-three/fiber'
import { Accessor, createEffect } from 'solid-js'
import { Texture } from 'three'
import { KTX2Loader } from 'three-stdlib'
import { when } from '../helpers/when'
import { IsObject } from './useTexture'

const cdn = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master'
export function useKTX2<Url extends string[] | string | Record<string, string>>(
  input: Url,
  basisPath: string = `${cdn}/basis/`
): Accessor<
  | (Url extends any[] ? Texture[] : Url extends object ? { [key in keyof Url]: Texture | undefined } : Texture)
  | undefined
> {
  const store = useThree()
  const textures = useLoader(KTX2Loader, IsObject(input) ? Object.values(input) : (input as any), (loader: any) => {
    loader.detectSupport(store.gl)
    loader.setTranscoderPath(basisPath)
  })

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  createEffect(() =>
    when(textures)((textures) => {
      const array = Array.isArray(textures) ? textures : [textures]
      array.forEach(store.gl.initTexture)
    })
  )

  return () => {
    if (IsObject(input)) {
      const keys = Object.keys(input)
      const keyed = {} as any
      keys.forEach((key) => Object.assign(keyed, { [key]: textures[keys.indexOf(key)] }))
      return keyed
    } else {
      return textures()
    }
  }
}

useKTX2.preload = (url: string extends any[] ? string[] : string, basisPath: string = `${cdn}/basis/`) =>
  useLoader.preload(KTX2Loader, url, (loader: any) => {
    loader.setTranscoderPath(basisPath)
  })

useKTX2.clear = (input: string | string[]) => useLoader.clear(KTX2Loader, input)
