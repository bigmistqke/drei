import { useLoader } from '@solid-three/fiber'
import { FBXLoader } from 'three-stdlib'

export function useFBX(path: string) {
  return useLoader(FBXLoader, path)
}

useFBX.preload = (path: string) => useLoader.preload(FBXLoader, path)
useFBX.clear = (input: string | string[]) => useLoader.clear(FBXLoader, input)
