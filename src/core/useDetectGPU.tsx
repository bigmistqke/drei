import { getGPUTier, GetGPUTier } from 'detect-gpu'
import { createResource } from 'solid-js'

export const useDetectGPU = (props?: GetGPUTier) => createResource(['useDetectGPU'], () => getGPUTier(props))[0]
