import { useLoader, useThree } from '@solid-three/fiber'
import { Accessor, createEffect, createMemo, createRenderEffect, createResource } from 'solid-js'
import { Texture, TextureLoader } from 'three'
import { when } from '../helpers/when'

export const IsObject = (url: any): url is Record<string, string> =>
  url === Object(url) && !Array.isArray(url) && typeof url !== 'function'

export function useTexture<Url extends string[] | string | Record<string, string>>(
  input: Accessor<Url> | Url,
  onLoad?: (texture: Url extends string[] ? Texture[] : Texture) => void
) {
  const store = useThree()
  const textures = useLoader(TextureLoader, () => {
    const _input = typeof input === 'function' ? input() : input
    return typeof _input === 'object' ? Object.values(_input) : _input
  })

  createRenderEffect(() => when(textures)((textures) => onLoad?.(textures)))

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  createEffect(() =>
    when(textures)((textures) => {
      const array: Texture[] = Array.isArray(textures) ? textures : [textures]
      array.forEach(store.gl.initTexture)
    })
  )

  const memo = createMemo(() => {
    if (IsObject(typeof input === 'function' ? input() : input)) {
      return when(textures)((textures) => {
        const keys = Object.keys(input)
        const keyed = {} as Record<string, Texture>
        keys.forEach((key) => {
          keyed[key] = textures[keys.indexOf(key)]
        })
        return keyed
      })
    } else {
      return textures()
    }
  })

  return createResource(
    memo,
    (memo) =>
      new Promise<
        Url extends string[] | Accessor<string[]>
          ? Texture[]
          : Url extends Record<string, string> | Accessor<Record<string, string>>
          ? { [key in keyof Url]: Texture }
          : Texture
      >((resolve) => {
        createRenderEffect(() => when(memo)(resolve))
      })
  )[0]
}

useTexture.preload = (url: string extends any[] ? string[] : string) => useLoader.preload(TextureLoader, url)
useTexture.clear = (input: string | string[]) => useLoader.clear(TextureLoader, input)
