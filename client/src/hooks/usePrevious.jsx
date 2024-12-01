import { useRef, useEffect } from "react";

/**
 * Custom hook to track the previous value of a given state or prop.
 * - Stores the previous value of the input using a ref.
 * - Updates the ref whenever the input value changes.
 *
 * @param {*} value - The current value to track.
 * @returns {*} - The previous value of the input.
 */
const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    // Update the ref with the current value after each render
    ref.current = value;
  }, [value]);

  // Return the previous value stored in the ref
  return ref.current;
};

export default usePrevious;
