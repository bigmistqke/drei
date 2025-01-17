import { color as colorKnob, number, withKnobs } from '@storybook/addon-knobs'
import { DoubleSide, Vector3 } from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { T } from '@solid-three/fiber'
import { Text } from '../../src'

export default {
  title: 'Abstractions/Text',
  component: Text,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(0, 0, 200)}>{storyFn()}</Setup>],
}

function TextScene() {
  const turntable = useTurntable()

  return (
    <T.Suspense fallback={null}>
      <Text
        ref={turntable}
        color={'#EC2D2D'}
        fontSize={12}
        maxWidth={200}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign={'left'}
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        anchorX="center"
        anchorY="middle"
      >
        LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
        MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
        CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA
        PARIATUR. EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST
        LABORUM.
      </Text>
    </T.Suspense>
  )
}

export const TextSt = () => <TextScene />
TextSt.storyName = 'Default'

function TextOutlineScene() {
  const turntable = useTurntable()

  return (
    <T.Suspense fallback={null}>
      <Text
        ref={turntable}
        color={'#EC2D2D'}
        fontSize={12}
        maxWidth={200}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign={'left'}
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={2}
        outlineColor="#ffffff"
      >
        LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
        MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
        CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA
        PARIATUR. EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST
        LABORUM.
      </Text>
    </T.Suspense>
  )
}

function TextStrokeScene() {
  const turntable = useTurntable()

  return (
    <T.Suspense fallback={null}>
      <Text
        ref={turntable}
        fontSize={12}
        maxWidth={200}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign={'left'}
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        strokeWidth={'2.5%'}
        strokeColor="#ffffff"
      >
        LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
        MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
        CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA
        PARIATUR. EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST
        LABORUM.
      </Text>
    </T.Suspense>
  )
}

function TextShadowScene() {
  const turntable = useTurntable()

  return (
    <T.Suspense fallback={null}>
      <Text
        ref={turntable}
        color={'#EC2D2D'}
        fontSize={12}
        maxWidth={200}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign={'left'}
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        anchorX="center"
        anchorY="middle"
        outlineOffsetX={'10%'}
        outlineOffsetY={'10%'}
        outlineBlur={'30%'}
        outlineOpacity={0.3}
        outlineColor="#EC2D2D"
      >
        LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
        MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
        CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA
        PARIATUR. EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST
        LABORUM.
      </Text>
    </T.Suspense>
  )
}

function TextRtlScene() {
  const turntable = useTurntable()

  return (
    <T.Suspense fallback={null}>
      <Text
        ref={turntable}
        color={'#EC2D2D'}
        fontSize={12}
        maxWidth={200}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign={'right'}
        direction={'auto'}
        font="https://fonts.gstatic.com/s/scheherazade/v20/YA9Ur0yF4ETZN60keViq1kQgtA.woff"
        anchorX="center"
        anchorY="middle"
      >
        إن عدة الشهور عند الله اثنا عشر شهرا في كتاب الله يوم خلق السماوات والارض SOME LATIN TEXT HERE منها أربعة حرم
        ذلك الدين القيم فلا تظلموا فيهن أنفسكم وقاتلوا المشركين كافة كما يقاتلونكم كافة واعلموا أن الله مع المتقين
      </Text>
    </T.Suspense>
  )
}

function CustomMaterialTextScene() {
  const turntable = useTurntable()
  const defaultColor = '#EC2D2D'

  return (
    <T.Suspense fallback={null}>
      <Text
        ref={turntable}
        fontSize={12}
        maxWidth={200}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign={'left'}
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        anchorX="center"
        anchorY="middle"
      >
        <T.MeshBasicMaterial
          side={DoubleSide}
          color={colorKnob('Color', defaultColor)}
          transparent
          opacity={number('Opacity', 1, { range: true, min: 0, max: 1, step: 0.1 })}
        />
        LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
        MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
        CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA
        PARIATUR. EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST
        LABORUM.
      </Text>
    </T.Suspense>
  )
}

export const TextOutlineSt = () => <TextOutlineScene />
TextOutlineSt.storyName = 'Outline'

export const TextStrokeSt = () => <TextStrokeScene />
TextStrokeSt.storyName = 'Transparent with stroke'

export const TextShadowSt = () => <TextShadowScene />
TextShadowSt.storyName = 'Text Shadow'

export const TextLtrSt = () => <TextRtlScene />
TextLtrSt.storyName = 'Text Rtl'

export const CustomMaterialTextSt = () => <CustomMaterialTextScene />
CustomMaterialTextSt.storyName = 'Custom Material'
