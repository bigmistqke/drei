import { Accessor, createMemo, createResource } from 'solid-js'
import { Texture } from 'three'
import { resolveAccessor } from '../helpers/resolveAccessor'
import { when } from '../helpers/when'
import { useTexture } from './useTexture'

function getFormatString(format: number) {
  switch (format) {
    case 64:
      return '-64px'
    case 128:
      return '-128px'
    case 256:
      return '-256px'
    case 512:
      return '-512px'
    default:
      return ''
  }
}

const LIST_URL = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/matcaps.json'
const MATCAP_ROOT = 'https://rawcdn.githack.com/emmelleppi/matcaps/9b36ccaaf0a24881a39062d05566c9e92be4aa0d'

export function useMatcapTexture(
  id: number | string | Accessor<number | string> = 0,
  format: number | Accessor<number> = 1024,
  onLoad?: (texture: Texture) => void
) {
  const [matcapList] = createResource(['matcapList'], () =>
    fetch(LIST_URL).then((res) => res.json() as unknown as Record<string, string>)
  )

  const DEFAULT_MATCAP = () => matcapList()?.[0]
  const numTot = createMemo(() => when(matcapList)((matcapList) => Object.keys(matcapList).length))

  const fileHash = createMemo(() => {
    const _id = resolveAccessor(id)
    if (typeof _id === 'string') {
      return _id
    } else if (typeof _id === 'number') {
      return matcapList()?.[_id]
    }
    return null
  })

  const _format = () => resolveAccessor(format)
  const fileName = () => `${fileHash() || DEFAULT_MATCAP()}${getFormatString(_format())}.png`
  const url = () => `${MATCAP_ROOT}/${_format()}/${fileName()}`

  const matcapTexture = useTexture(url, onLoad)

  return [matcapTexture, url, numTot] as const
}
