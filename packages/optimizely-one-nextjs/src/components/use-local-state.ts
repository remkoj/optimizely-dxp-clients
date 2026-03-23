'use client'
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'

/**
 * Reads and persists component state in `window.localStorage` under the provided key.
 *
 * The hook keeps the in-memory value synchronized with `localStorage` updates from
 * other browser tabs by listening to the `storage` event.
 *
 * @typeParam S The state value type.
 * @param localStorageKey The `localStorage` key used to read and write the state.
 * @returns The current state value and a React state setter.
 */
export function useLocalState<S>(localStorageKey: string): [S | undefined, Dispatch<SetStateAction<S | undefined>>]
export function useLocalState<S>(localStorageKey: string, initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
export function useLocalState<S>(localStorageKey: string, initialState?: S | (() => S)): [S | undefined, Dispatch<SetStateAction<S | undefined>>]
{
    const [internalState, setInternalState] = useState<S | undefined>(initialState);

    // Everytime the localstoragekey changes, we'll update the 
    // state from local storage. Also we'll register event handlers
    // to ensure state consistency across windows
    useEffect(() => {
        function updateFromLocalStorage() {
            const localStorageValue = window.localStorage.getItem(localStorageKey);
            if (!localStorageValue)
                return;
            const parsedValue = tryParseJson<S>(localStorageValue);
            setInternalState(parsedValue);
        }

        function eventHandler(e: StorageEvent) {
            if (e.storageArea === window.localStorage && e.key === localStorageKey) {
                updateFromLocalStorage()
            }
        }

        updateFromLocalStorage();
        window.addEventListener('storage', eventHandler);
        return () => {
            window.removeEventListener('storage', eventHandler);
        }
    }, [ localStorageKey ]);

    // Every time the internal state, or storage key changes, we'll
    // write to localstorage
    useEffect(() => {
        window.localStorage.setItem(localStorageKey, JSON.stringify(internalState))
    }, [ internalState, localStorageKey ])

    return [internalState, setInternalState]
}


/**
 * Parses a JSON string and returns the decoded value.
 *
 * If the input is already a non-string value, it is returned as-is.
 *
 * @typeParam R The expected return type.
 * @param input The value to parse.
 * @param reviver The reviver passed to `JSON.parse()`.
 * @returns The parsed value, the original non-string input, or `undefined` when parsing fails.
 */
export function tryParseJson<R = any>(input?: R | string | null, reviver?: (this: any, key: string, value: any) => any) : R|undefined {
  try {
    if (input && typeof(input) === "string")
      return JSON.parse(input, reviver) as R
    return input as R
  } catch {
    // Ignored on purpose
  }
  return undefined
}
