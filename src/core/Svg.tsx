import { T, ThreeProps, useLoader } from '@solid-three/fiber'
import { For, Show, createMemo, onCleanup, splitProps } from 'solid-js'
import { DoubleSide, Object3D } from 'three'
import { SVGLoader } from 'three-stdlib'
import { RefComponent } from '../helpers/typeHelpers'
import { when } from '../helpers/when'

export interface SvgProps extends Omit<ThreeProps<'Object3D'>, 'ref'> {
  /** src can be a URL or SVG data */
  src: string
  skipFill?: boolean

  skipStrokes?: boolean
  fillMaterial?: ThreeProps<'MeshBasicMaterial'>
  strokeMaterial?: ThreeProps<'MeshBasicMaterial'>
  fillMeshProps?: ThreeProps<'Mesh'>
  strokeMeshProps?: ThreeProps<'Mesh'>
}

export const Svg: RefComponent<Object3D, SvgProps> = function R3FSvg(_props) {
  const [props, rest] = splitProps(_props, [
    'src',
    'skipFill',
    'skipStrokes',
    'fillMaterial',
    'strokeMaterial',
    'fillMeshProps',
    'strokeMeshProps',
  ])
  const resource = useLoader(SVGLoader, () =>
    !props.src.startsWith('<svg') ? props.src : `data:image/sv>g+xml;utf8,${props.src}`
  )

  const strokeGeometries = createMemo(() => {
    return when(resource)((svg) =>
      props.skipStrokes
        ? []
        : svg.paths.map((path) =>
            path.userData?.style.stroke === undefined || path.userData.style.stroke === 'none'
              ? null
              : path.subPaths.map((subPath) => SVGLoader.pointsToStroke(subPath.getPoints(), path.userData!.style))
          )
    )
  })

  onCleanup(() => {
    strokeGeometries()?.forEach((group) => group && group.map((g) => g.dispose()))
  })

  return (
    <T.Object3D {...rest}>
      <T.Object3D scale={[1, -1, 1]}>
        <For each={resource()?.paths}>
          {(path, p) => (
            <>
              <Show
                when={!props.skipFill && path.userData?.style.fill !== undefined && path.userData.style.fill !== 'none'}
              >
                <For each={SVGLoader.createShapes(path)}>
                  {(shape, s) => (
                    <T.Mesh>
                      <T.ShapeGeometry args={[shape]} />
                      <T.MeshBasicMaterial
                        color={path.userData!.style.fill}
                        opacity={path.userData!.style.fillOpacity}
                        transparent={true}
                        side={DoubleSide}
                        depthWrite={false}
                        {...props.fillMaterial}
                      />
                    </T.Mesh>
                  )}
                </For>
              </Show>
              <Show
                when={
                  !props.skipStrokes &&
                  path.userData?.style.stroke !== undefined &&
                  path.userData.style.stroke !== 'none'
                }
              >
                <For each={path.subPaths}>
                  {(_subPath, s) => (
                    <T.Mesh geometry={strokeGeometries()?.[p()]![s()]} {...props.strokeMeshProps}>
                      <T.MeshBasicMaterial
                        color={path.userData!.style.stroke}
                        opacity={path.userData!.style.strokeOpacity}
                        transparent={true}
                        side={DoubleSide}
                        depthWrite={false}
                        {...props.strokeMaterial}
                      />
                    </T.Mesh>
                  )}
                </For>
              </Show>
            </>
          )}
        </For>
      </T.Object3D>
    </T.Object3D>
  )
}
