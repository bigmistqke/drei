/* eslint-disable react-hooks/rules-of-hooks */
import { Context, JSX, createMemo, useContext } from 'solid-js'
import { Dynamic } from 'solid-js/web'

export function useContextBridge(...contexts: Array<Context<any>>) {
  let cRef: Array<Context<any>> = []
  cRef = contexts.map((context) => useContext(context))
  const memo = createMemo(
    () =>
      (props: { children: JSX.Element }): JSX.Element =>
        contexts.reduceRight(
          (acc, Context, i) => <Context.Provider value={cRef[i]} children={acc} />,
          props.children
          /*
           * done this way in reference to:
           * https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44572#issuecomment-625878049
           * https://github.com/microsoft/TypeScript/issues/14729
           */
        ) as unknown as JSX.Element,
    []
  )

  return (props: { children: JSX.Element | Array<JSX.Element> }) => (
    <Dynamic component={memo()}>{props.children}</Dynamic>
  )
}
