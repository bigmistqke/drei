import { Component, ParentComponent } from 'solid-js'

export type KeyOfOptionals<T> = keyof {
  [K in keyof T as T extends Record<K, T[K]> ? never : K]: T[K]
}

export type RefComponent<TRef, TProps = Record<string, any>, TParent = false> = TParent extends true
  ? ParentComponent<Omit<TProps, 'ref'> & { ref?: TRef | ((value: TRef) => void) }>
  : Component<Omit<TProps, 'ref'> & { ref?: TRef | ((value: TRef) => void) }>
