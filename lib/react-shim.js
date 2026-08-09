import React from '../node_modules/react/index.js';

export const {
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  act,
  cloneElement,
  createContext,
  createElement,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  unstable_act,
  useActionState,
  useId,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version,
} = React;

export const useEffectEvent =
  React.experimental_useEffectEvent ||
  React.useEffectEvent ||
  function useEffectEvent(fn) {
    const ref = useRef(fn);
    useInsertionEffect(() => {
      ref.current = fn;
    });
    return useCallback((...args) => {
      return ref.current?.(...args);
    }, []);
  };

export const experimental_useEffectEvent = useEffectEvent;

export default React;
