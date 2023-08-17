import { createThreeResource, useLoader } from '@solid-three/fiber'
import { Resource, createRenderEffect } from 'solid-js'
import { CubeTexture, CubeTextureLoader } from 'three'
import { when } from '../helpers/when'

type Options = {
  path: string
}

export function useCubeTexture(files: string[], { path }: Options) {
  const loader = useLoader(CubeTextureLoader, [files], (loader) => loader.setPath(path)) as Resource<CubeTexture>
  return createThreeResource(
    () =>
      new Promise<CubeTexture>((resolve) => {
        createRenderEffect(() => when(loader)((loader) => resolve(loader[0])))
      })
  )[0]
}

/* useCubeTexture.preload = (files: string[], { path }: Options) =>
  useLoader.preload(
    // @ts-ignore
    CubeTextureLoader,
    [files],
    (loader: CubeTextureLoader) => loader.setPath(path)
  )
 */
