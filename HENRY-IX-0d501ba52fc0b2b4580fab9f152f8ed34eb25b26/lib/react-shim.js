import * as React from '../node_modules/react';

export const useEffectEvent =
  React.experimental_useEffectEvent ||
  React.useEffectEvent ||
  function useEffectEvent(fn) {
    const ref = React.useRef(fn);
    React.useInsertionEffect(() => {
      ref.current = fn;
    });
    return React.useCallback((...args) => {
      return ref.current?.(...args);
    }, []);
  };

export * from '../node_modules/react';
export default React;
