import { addAfterEffect, addEffect } from '@solid-three/fiber'
import { createEffect, onCleanup } from 'solid-js'
import StatsImpl from 'stats.js'
import { defaultProps } from '../helpers/defaultProps'

type Props = {
  showPanel?: number
  className?: string
  parent?: HTMLElement
}

export function Stats(_props: Props): null {
  const props = defaultProps(_props, {
    showPanel: 0,
  })

  // sf3:   original was const stats = useEffectfulState(() => new StatsImpl(), [])
  const stats = new StatsImpl()
  createEffect(() => {
    const node = props.parent || document.body
    stats.showPanel(props.showPanel)
    node?.appendChild(stats.dom)
    if (props.className) stats.dom.classList.add(...props.className.split(' ').filter((cls) => cls))
    const cleanupBegin = addEffect(() => stats.begin())
    const cleanupEnd = addAfterEffect(() => stats.end())
    onCleanup(() => {
      node?.removeChild(stats.dom)
      cleanupBegin()
      cleanupEnd()
    })
  })
  return null
}
