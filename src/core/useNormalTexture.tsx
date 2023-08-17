import { createThreeResource } from '@solid-three/fiber'
import { createRenderEffect, createResource } from 'solid-js'
import { RepeatWrapping, Texture, Vector2 } from 'three'
import { defaultProps } from '../helpers/defaultProps'
import { when } from '../helpers/when'
import { useTexture } from './useTexture'

const NORMAL_ROOT = 'https://rawcdn.githack.com/pmndrs/drei-assets/7a3104997e1576f83472829815b00880d88b32fb'
const LIST_URL = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/normals/normals.json'

type Settings = {
  repeat?: number[]
  anisotropy?: number
  offset?: number[]
}

export function useNormalTexture(id = 0, _settings: Settings, onLoad?: (texture: Texture | Texture[]) => void) {
  const settings = defaultProps(_settings, { repeat: [1, 1], anisotropy: 1, offset: [0, 0] })

  const [normalsList] = createResource(['normalsList'], () =>
    fetch(LIST_URL).then((res) => res.json() as unknown as Record<string, string>)
  )

  const numTot = () => when(normalsList)((list) => Object.keys(list).length)
  const imageName = () => when(normalsList)((list) => list[id] || list[0])
  const url = () => when(imageName)((name) => `${NORMAL_ROOT}/normals/${name}`)

  const [texture] = createThreeResource(
    url,
    (url) =>
      new Promise<Texture>((resolve) => {
        const texture = useTexture(url, onLoad)
        createRenderEffect(() => when(texture)(resolve))
      })
  )

  createRenderEffect(() =>
    when(texture)((texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.repeat = new Vector2(settings.repeat[0], settings.repeat[1])
      texture.offset = new Vector2(settings.offset[0], settings.offset[1])
      texture.anisotropy = settings.anisotropy
    })
  )

  return () => when(texture, url, numTot)((texture, url, numTot) => ({ texture, url, numTot }))
}
