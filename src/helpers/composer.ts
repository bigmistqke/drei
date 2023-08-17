import { JSX } from 'solid-js'

export default function Composer(props: {
  children: (results) => JSX.Element | Array<JSX.Element>
  components: Array<JSX.Element>
}) {
  return renderRecursive(props.children, props.components)
}

/**
 * Recursively build up elements from props.components and accumulate `results` along the way.
 * @param {function} render
 * @param {Array.<ReactElement|Function>} remaining
 * @param {Array} [results]
 * @returns {ReactElement}
 */
function renderRecursive(render: any, remaining: any, results?: any) {
  results = results || []
  // Once components is exhausted, we can render out the results array.
  if (!remaining[0]) {
    return render(results)
  }

  // Continue recursion for remaining items.
  // results.concat([value]) ensures [...results, value] instead of [...results, ...value]
  function nextRender(value) {
    return renderRecursive(render, remaining.slice(1), results.concat([value]))
  }

  // Each props.components entry is either an element or function [element factory]
  /* return typeof remaining[0] === 'function'
    ? // When it is a function, produce an element by invoking it with "render component values". */
  return remaining[0]({ results, render: nextRender })
  /*  : // When it is an element, enhance the element's props with the render prop.
      cloneElement(remaining[0], { children: nextRender }); */
}
