import { Accessor } from 'solid-js'

type Filter<T> = Exclude<T, null | undefined | false>

export function when<
  const T,
  TAccessors extends Array<Accessor<T> | T>,
  const TValues extends {
    [TKey in keyof TAccessors]: TAccessors[TKey] extends ((...args: any[]) => any) | undefined
      ? Filter<ReturnType<Exclude<TAccessors[TKey], undefined>>>
      : Filter<TAccessors[TKey]>
  }
>(...accessors: TAccessors) {
  function callback<const TResult>(callback: (...values: TValues) => TResult) {
    const values = new Array(accessors.length)

    for (let i = 0; i < accessors.length; i++) {
      const _value = typeof accessors[i] === 'function' ? (accessors[i] as () => T)() : accessors[i]
      if (_value === undefined || _value === null || _value === false) return undefined
      values[i] = _value
    }

    return callback(...(values as any))
  }
  return callback
}

export function all<
  const T,
  TAccessors extends Array<Accessor<T> | T>,
  const TValues extends {
    [TKey in keyof TAccessors]: TAccessors[TKey] extends () => any
      ? Filter<ReturnType<TAccessors[TKey]>>
      : Filter<TAccessors[TKey]>
  }
>(...accessors: TAccessors): TValues | undefined {
  const values = new Array(accessors.length)

  for (let i = 0; i < accessors.length; i++) {
    const _value = typeof accessors[i] === 'function' ? (accessors[i] as () => T)() : accessors[i]
    if (_value === undefined || _value === null || _value === false) return undefined
    values[i] = _value
  }

  return values as TValues
}

/* function pipe<T>(pipeCallback: () => T) {
  function curry<U>(curryCallback: (value: Filter<T>) => U): {
    <S>(next: (value: Filter<U>) => S): ReturnType<typeof curry<S>>
    value: Filter<U> | undefined
  } {
    Object.defineProperty(curry, 'value', {
      value: () => all(curryCallback),
    })
    return curry as any
  }
  Object.defineProperty(curry, 'value', {
    value: () => all(pipeCallback),
  })

  return curry
}
const x = pipe(() => Math.random() > 0.5)((value) => 'ok')((value) => 0)((value) => false)((value) => false)(
  (value) => false
)((value) => false)((value) => false)((value) => false)((value) => false)((value) => false).value

type Pipe<T> = T extends readonly [infer First, infer Second, ...infer Rest]
  ? First extends () => any
    ? Second extends (arg: any) => any
      ? readonly [First, ...Pipe<[(arg: ReturnType<First>) => ReturnType<Second>, ...Rest]>]
      : never
    : First extends (arg: any) => any
    ? Second extends (arg: any) => any
      ? readonly [First, ...Pipe<[(arg: ReturnType<First>) => ReturnType<Second>, ...Rest]>]
      : never
    : never
  : T

const cb = [() => 'ok', (value) => false, (value) => 'string'] as const
type CB = typeof cb
type X = Pipe<CB>

function pipe2<const T extends readonly any[]>(...args: T) {
  return undefined as any as Pipe<T>
}

const p = pipe2(
  () => 'ok',
  (value) => false,
  (value) => 'string'
) */
