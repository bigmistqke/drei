import { applyProps, useThree } from '@solid-three/fiber'
import { Accessor, createSignal } from 'solid-js'
import { Camera, Intersection, Raycaster } from 'three'

export function useCamera(camera: Camera | Accessor<Camera>, props?: Partial<Raycaster>) {
  const store = useThree()
  const [raycast] = createSignal(() => {
    const raycaster = new Raycaster()
    /**
     * applyProps is an internal method of r3f and
     * therefore requires its first arg to be an
     * "Instance" a term used with the Reconciler
     * so we have an expect error to mask this
     */
    // @ts-expect-error
    if (props) applyProps(raycaster, props, {})
    return function (_: Raycaster, intersects: Intersection[]): void {
      raycaster.setFromCamera(store.pointer, camera instanceof Camera ? camera : camera())
      const rc = this.constructor.prototype.raycast.bind(this)
      if (rc) rc(raycaster, intersects)
    }
  })
  return raycast
}
