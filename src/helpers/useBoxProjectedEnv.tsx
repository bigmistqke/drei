import { createMemo, createRenderEffect, on } from 'solid-js'
import * as THREE from 'three'
import { resolveAccessor } from './resolveAccessor'

// credits for the box-projecting shader code go to codercat (https://codercat.tk)
// and @0beqz https://gist.github.com/0beqz/8d51b4ae16d68021a09fb504af708fca

const worldposReplace = /* glsl */ `
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
  vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
  #ifdef BOX_PROJECTED_ENV_MAP
    vWorldPosition = worldPosition.xyz;
  #endif
#endif
`

const boxProjectDefinitions = /*glsl */ `
#ifdef BOX_PROJECTED_ENV_MAP
  uniform vec3 envMapSize;
  uniform vec3 envMapPosition;
  varying vec3 vWorldPosition;
    
  vec3 parallaxCorrectNormal( vec3 v, vec3 cubeSize, vec3 cubePos ) {
    vec3 nDir = normalize( v );
    vec3 rbmax = ( .5 * cubeSize + cubePos - vWorldPosition ) / nDir;
    vec3 rbmin = ( -.5 * cubeSize + cubePos - vWorldPosition ) / nDir;
    vec3 rbminmax;
    rbminmax.x = ( nDir.x > 0. ) ? rbmax.x : rbmin.x;
    rbminmax.y = ( nDir.y > 0. ) ? rbmax.y : rbmin.y;
    rbminmax.z = ( nDir.z > 0. ) ? rbmax.z : rbmin.z;
    float correction = min( min( rbminmax.x, rbminmax.y ), rbminmax.z );
    vec3 boxIntersection = vWorldPosition + nDir * correction;    
    return boxIntersection - cubePos;
  }
#endif
`

// will be inserted after "vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );"
const getIBLIrradiance_patch = /* glsl */ `
#ifdef BOX_PROJECTED_ENV_MAP
  worldNormal = parallaxCorrectNormal( worldNormal, envMapSize, envMapPosition );
#endif
`

// will be inserted after "reflectVec = inverseTransformDirection( reflectVec, viewMatrix );"
const getIBLRadiance_patch = /* glsl */ `
#ifdef BOX_PROJECTED_ENV_MAP
  reflectVec = parallaxCorrectNormal( reflectVec, envMapSize, envMapPosition );
#endif
`

function boxProjectedEnvMap(shader: THREE.Shader, envMapPosition: THREE.Vector3, envMapSize: THREE.Vector3) {
  // defines
  ;(shader as any).defines.BOX_PROJECTED_ENV_MAP = true
  // uniforms
  shader.uniforms.envMapPosition = { value: envMapPosition }
  shader.uniforms.envMapSize = { value: envMapSize }
  // vertex shader
  shader.vertexShader = `
  varying vec3 vWorldPosition;
  ${shader.vertexShader.replace('#include <worldpos_vertex>', worldposReplace)}`
  // fragment shader
  shader.fragmentShader = `
    ${boxProjectDefinitions}
    ${shader.fragmentShader
      .replace('#include <envmap_physical_pars_fragment>', THREE.ShaderChunk.envmap_physical_pars_fragment)
      .replace(
        'vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );',
        `vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
         ${getIBLIrradiance_patch}
         `
      )
      .replace(
        'reflectVec = inverseTransformDirection( reflectVec, viewMatrix );',
        `reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
         ${getIBLRadiance_patch}
        `
      )}`
}

// s3f:   changed the signature and the implementation quite a lot.
export function useBoxProjectedEnv(
  position: THREE.Vector3 | (() => THREE.Vector3) = () => new THREE.Vector3(),
  size: THREE.Vector3 | (() => THREE.Vector3) = () => new THREE.Vector3()
) {
  let ref: THREE.Material = null!
  const spread = createMemo(() => ({
    ref,
    onBeforeCompile: (shader: THREE.Shader) =>
      boxProjectedEnvMap(shader, resolveAccessor(position), resolveAccessor(size)),
    customProgramCacheKey: () =>
      JSON.stringify(resolveAccessor(position).toArray()) + JSON.stringify(resolveAccessor(size).toArray()),
  }))
  createRenderEffect(
    on(
      () => resolveAccessor(position) && resolveAccessor(size),
      (boolean) => boolean && (ref.needsUpdate = true)
    )
  )
  return spread
}
