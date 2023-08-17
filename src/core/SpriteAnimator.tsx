import { T, ThreeProps, useFrame, useThree, Vector3 } from '@solid-three/fiber'
import { Component, createEffect, createRenderEffect, createSignal, on, onMount, splitProps, Suspense } from 'solid-js'
import * as THREE from 'three'

export type SpriteAnimatorProps = {
  startFrame?: number
  endFrame?: number
  fps?: number
  frameName?: string
  textureDataURL?: string
  textureImageURL: string
  loop?: boolean
  numberOfFrames?: number
  autoPlay?: boolean
  animationNames?: Array<string>
  onStart?: Function
  onEnd?: Function
  onLoopEnd?: Function
  onFrame?: Function
  play?: boolean
  pause?: boolean
  flipX?: boolean
  position?: Array<number>
  alphaTest?: number
} & ThreeProps<'Group'>

// s3f:   should it be a forwardRef?
export const SpriteAnimator: Component<SpriteAnimatorProps> = (_props, fref) => {
  const [props, rest] = splitProps(_props, [
    'startFrame',
    'endFrame',
    'fps',
    'frameName',
    'textureDataURL',
    'textureImageURL',
    'loop',
    'numberOfFrames',
    'autoPlay',
    'animationNames',
    'onStart',
    'onEnd',
    'onLoopEnd',
    'onFrame',
    'play',
    'pause',
    'flipX',
    'alphaTest',
    'children',
  ])

  const store = useThree()
  let spriteData: any = null
  const [isJsonReady, setJsonReady] = createSignal(false)
  let matRef: any
  let spriteRef: any
  let timerOffset = window.performance.now()
  let textureData: any
  let currentFrame: number = props.startFrame || 0
  let currentFrameName: string = props.frameName || ''
  const fpsInterval = 1000 / (props.fps || 30)
  const [spriteTexture, setSpriteTexture] = createSignal<THREE.Texture>(new THREE.Texture())
  let totalFrames = 0
  const [aspect, setAspect] = createSignal<Vector3 | undefined>([1, 1, 1])
  const flipOffset = () => (props.flipX ? -1 : 1)

  function loadJsonAndTextureAndExecuteCallback(
    jsonUrl: string,
    textureUrl: string,
    callback: (json: any, texture: THREE.Texture) => void
  ): void {
    const textureLoader = new THREE.TextureLoader()
    const jsonPromise = fetch(jsonUrl).then((response) => response.json())
    const texturePromise = new Promise<THREE.Texture>((resolve) => {
      textureLoader.load(textureUrl, resolve)
    })

    Promise.all([jsonPromise, texturePromise]).then((response) => {
      callback(response[0], response[1])
    })
  }

  const calculateAspectRatio = (width: number, height: number): Vector3 => {
    const aspectRatio = height / width
    spriteRef.scale.set(1, aspectRatio, 1)
    return [1, aspectRatio, 1]
  }

  // initial loads
  onMount(() => {
    if (props.textureDataURL && props.textureImageURL) {
      loadJsonAndTextureAndExecuteCallback(props.textureDataURL, props.textureImageURL, parseSpriteData)
    } else if (props.textureImageURL) {
      // only load the texture, this is an image sprite only
      const textureLoader = new THREE.TextureLoader()
      new Promise<THREE.Texture>((resolve) => {
        textureLoader.load(props.textureImageURL, resolve)
      }).then((texture) => {
        parseSpriteData(null, texture)
      })
    }
  })

  createRenderEffect(
    on(
      // s3f:   unclear if spriteTexture() would trigger modifySpritePosition() without being included in on
      () => [spriteTexture(), props.flipX],
      () => {
        modifySpritePosition()
      }
    )
  )

  // s3f:   unnecessary effect?
  createEffect(() => {
    if (props.autoPlay === false) {
      if (props.play) {
      }
    }
  }, [props.pause])

  createEffect(() => {
    if (currentFrameName !== props.frameName && props.frameName) {
      currentFrame = 0
      currentFrameName = props.frameName
    }
  })

  const parseSpriteData = (json: any, _spriteTexture: THREE.Texture): void => {
    // sprite only case
    if (json === null) {
      if (_spriteTexture && props.numberOfFrames) {
        //get size from texture
        const width = _spriteTexture.image.width
        const height = _spriteTexture.image.height
        const frameWidth = width / props.numberOfFrames
        const frameHeight = height
        textureData = _spriteTexture
        totalFrames = props.numberOfFrames
        spriteData = {
          frames: [],
          meta: {
            version: '1.0',
            size: { w: width, h: height },
            scale: '1',
          },
        }

        if (parseInt(frameWidth.toString(), 10) === frameWidth) {
          // if it fits
          for (let i = 0; i < props.numberOfFrames; i++) {
            spriteData.frames.push({
              frame: { x: i * frameWidth, y: 0, w: frameWidth, h: frameHeight },
              rotated: false,
              trimmed: false,
              spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
              sourceSize: { w: frameWidth, h: height },
            })
          }
        }
      }
    } else if (_spriteTexture) {
      spriteData = json
      spriteData.frames = Array.isArray(json.frames) ? json.frames : parseFrames()
      totalFrames = Array.isArray(json.frames) ? json.frames.length : Object.keys(json.frames).length
      textureData = _spriteTexture

      const { w, h } = getFirstItem(json.frames).sourceSize
      const aspect = calculateAspectRatio(w, h)

      setAspect(aspect)
      if (matRef) {
        matRef.map = _spriteTexture
      }
    }

    _spriteTexture.premultiplyAlpha = false

    setSpriteTexture(_spriteTexture)
  }

  // for frame based JSON Hash sprite data
  const parseFrames = (): any => {
    const sprites: any = {}
    const data = spriteData
    const delimiters = props.animationNames
    if (delimiters) {
      for (let i = 0; i < delimiters.length; i++) {
        sprites[delimiters[i]] = []

        for (let innerKey in data['frames']) {
          const value = data['frames'][innerKey]
          const frameData = value['frame']
          const x = frameData['x']
          const y = frameData['y']
          const width = frameData['w']
          const height = frameData['h']
          const sourceWidth = value['sourceSize']['w']
          const sourceHeight = value['sourceSize']['h']

          if (typeof innerKey === 'string' && innerKey.toLowerCase().indexOf(delimiters[i].toLowerCase()) !== -1) {
            sprites[delimiters[i]].push({
              x: x,
              y: y,
              w: width,
              h: height,
              frame: frameData,
              sourceSize: { w: sourceWidth, h: sourceHeight },
            })
          }
        }
      }
    }

    return sprites
  }

  // modify the sprite material after json is parsed and state updated
  const modifySpritePosition = (): void => {
    if (!spriteData) return
    const {
      meta: { size: metaInfo },
      frames,
    } = spriteData

    const { w: frameW, h: frameH } = Array.isArray(frames)
      ? frames[0].sourceSize
      : props.frameName
      ? frames[props.frameName]
        ? frames[props.frameName][0].sourceSize
        : { w: 0, h: 0 }
      : { w: 0, h: 0 }

    matRef.map.wrapS = matRef.map.wrapT = THREE.RepeatWrapping
    matRef.map.center.set(0, 0)
    matRef.map.repeat.set((1 * flipOffset()) / (metaInfo.w / frameW), 1 / (metaInfo.h / frameH))

    //const framesH = (metaInfo.w - 1) / frameW
    const framesV = (metaInfo.h - 1) / frameH
    const frameOffsetY = 1 / framesV
    matRef.map.offset.x = 0.0 //-matRef.map.repeat.x
    matRef.map.offset.y = 1 - frameOffsetY

    setJsonReady(true)
    if (props.onStart) props.onStart({ currentFrameName: props.frameName, currentFrame: currentFrame })
  }

  // run the animation on each frame
  const runAnimation = (): void => {
    //if (!frameName) return
    const now = window.performance.now()
    const diff = now - timerOffset
    const {
      meta: { size: metaInfo },
      frames,
    } = spriteData
    const { w: frameW, h: frameH } = getFirstItem(frames).sourceSize
    const spriteFrames = Array.isArray(frames) ? frames : props.frameName ? frames[props.frameName] : []

    let finalValX = 0
    let finalValY = 0
    const _endFrame = props.endFrame || spriteFrames.length - 1

    if (currentFrame > _endFrame) {
      currentFrame = props.loop ? props.startFrame ?? 0 : 0
      if (props.loop) {
        props.onLoopEnd?.({
          currentFrameName: props.frameName,
          currentFrame: currentFrame,
        })
      } else {
        props.onEnd?.({
          currentFrameName: props.frameName,
          currentFrame: currentFrame,
        })
      }
      if (!props.loop) return
    }

    if (diff <= fpsInterval) return
    timerOffset = now - (diff % fpsInterval)

    calculateAspectRatio(frameW, frameH)
    const framesH = (metaInfo.w - 1) / frameW
    const framesV = (metaInfo.h - 1) / frameH
    const {
      frame: { x: frameX, y: frameY },
      sourceSize: { w: originalSizeX, h: originalSizeY },
    } = spriteFrames[currentFrame]
    const frameOffsetX = 1 / framesH
    const frameOffsetY = 1 / framesV
    finalValX =
      flipOffset() > 0
        ? frameOffsetX * (frameX / originalSizeX)
        : frameOffsetX * (frameX / originalSizeX) - matRef.map.repeat.x
    finalValY = Math.abs(1 - frameOffsetY) - frameOffsetY * (frameY / originalSizeY)

    matRef.map.offset.x = finalValX
    matRef.map.offset.y = finalValY

    currentFrame += 1
  }

  // *** Warning! It runs on every frame! ***
  useFrame((state, delta) => {
    if (!spriteData?.frames || !matRef?.map) {
      return
    }

    if (props.pause) {
      return
    }

    if (props.autoPlay || props.play) {
      runAnimation()
      props.onFrame && props.onFrame({ currentFrameName: currentFrameName, currentFrame: currentFrame })
    }
  })

  // utils
  const getFirstItem = (param: any): any => {
    if (Array.isArray(param)) {
      return param[0]
    } else if (typeof param === 'object' && param !== null) {
      const keys = Object.keys(param)
      return param[keys[0]][0]
    } else {
      return { w: 0, h: 0 }
    }
  }

  return (
    <T.Group {...rest}>
      <Suspense fallback={null}>
        <T.Sprite ref={spriteRef} scale={aspect()}>
          <T.SpriteMaterial
            toneMapped={false}
            ref={matRef}
            map={spriteTexture()}
            transparent={true}
            alphaTest={props.alphaTest ?? 0.0}
          />
        </T.Sprite>
      </Suspense>
      {props.children}
    </T.Group>
  )
}
