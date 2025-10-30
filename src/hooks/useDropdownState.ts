/**
 * Custom hook for managing dropdown open/closed state
 * Can be used by consumers to control and track the dropdown state
 */

import { useState, useCallback } from "react";

export interface DropdownState {
  /** Whether the dropdown is currently open */
  isOpen: boolean;
  /** Function to open the dropdown */
  open: () => void;
  /** Function to close the dropdown */
  close: () => void;
  /** Function to toggle the dropdown state */
  toggle: () => void;
  /** Function to set the dropdown state directly */
  setIsOpen: (isOpen: boolean) => void;
}

/**
 * Hook to manage dropdown open/closed state
 *
 * @param initialState - Initial state of the dropdown (default: false)
 * @returns DropdownState object with state and control functions
 *
 * @example
 * ```tsx
 * const dropdownState = useDropdownState();
 *
 * <QueryEditor
 *   value={query}
 *   columns={columns}
 *   onChange={handleChange}
 *   isOpen={dropdownState.isOpen}
 *   onOpenChange={dropdownState.setIsOpen}
 * />
 *
 * // Track when dropdown opens/closes
 * useEffect(() => {
 *   console.log('Dropdown is:', dropdownState.isOpen ? 'open' : 'closed');
 * }, [dropdownState.isOpen]);
 * ```
 */
export function useDropdownState(initialState: boolean = false): DropdownState {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}
