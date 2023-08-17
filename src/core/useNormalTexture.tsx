import { createMemo, createRenderEffect, createResource } from 'solid-js'
import { RepeatWrapping, Texture, Vector2 } from 'three'
import { when } from '../helpers/when'
import { useTexture } from './useTexture'

const NORMAL_ROOT = 'https://rawcdn.githack.com/pmndrs/drei-assets/7a3104997e1576f83472829815b00880d88b32fb'
const LIST_URL = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/normals/normals.json'

type Settings = {
  repeat?: number[]
  anisotropy?: number
  offset?: number[]
}

export function useNormalTexture(id = 0, settings: Settings = {}, onLoad?: (texture: Texture | Texture[]) => void) {
  const { repeat = [1, 1], anisotropy = 1, offset = [0, 0] } = settings

  const [normalsList] = createResource(['normalsList'], () =>
    fetch(LIST_URL).then((res) => res.json() as unknown as Record<string, string>)
  )

  const numTot = createMemo(() => when(normalsList)((normalsList) => Object.keys(normalsList).length))
  const DEFAULT_NORMAL = () => normalsList()?.[0]

  const imageName = () => normalsList()?.[id] || DEFAULT_NORMAL
  const url = () => `${NORMAL_ROOT}/normals/${imageName()}`

  const texture = useTexture(url, onLoad)

  createRenderEffect(() =>
    when(texture)((texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.repeat = new Vector2(repeat[0], repeat[1])
      texture.offset = new Vector2(offset[0], offset[1])
      texture.anisotropy = anisotropy
    })
  )

  return () => when(texture, url, numTot)((texture, url, numTot) => ({ texture, url, numTot }))
}
