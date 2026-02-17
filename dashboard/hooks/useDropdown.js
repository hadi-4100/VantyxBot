"use client";
import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Hook to calculate position relative to the viewport.
 * Consumes a ref and returns coordinates for fixed positioning.
 */
export function useDropdownPosition(ref) {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    triggerTop: 0,
    triggerBottom: 0,
  });

  const updatePosition = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        triggerTop: rect.top,
        triggerBottom: rect.bottom,
      });
    }
  }, [ref]);

  useEffect(() => {
    if (ref.current) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [ref, updatePosition]);

  return position;
}

/**
 * Global state-aware hook for managing dropdown opening/closing.
 * Ensures only one dropdown (or any other global component) is open at a time.
 */
let globalActiveId = null;
let globalCloseListeners = new Set();

export function useDropdown() {
  const [activeId, setActiveId] = useState(null);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    triggerTop: 0,
    triggerBottom: 0,
  });
  const [search, setSearch] = useState("");
  const triggerRef = useRef(null);

  const closeDropdown = useCallback(() => {
    globalActiveId = null;
    setActiveId(null);
    setSearch("");
    triggerRef.current = null;
    globalCloseListeners.forEach((listener) => listener(null));
  }, []);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom, // Legacy support
        left: rect.left,
        width: rect.width,
        triggerTop: rect.top,
        triggerBottom: rect.bottom,
      });
    }
  }, []);

  const toggleDropdown = useCallback(
    (id, element) => {
      if (!element) return;

      if (globalActiveId === id) {
        closeDropdown();
      } else {
        // Close other dropdowns
        globalCloseListeners.forEach((listener) => listener(null));

        triggerRef.current = element;
        globalActiveId = id;
        setActiveId(id);
        setSearch("");
        updatePosition();
      }
    },
    [closeDropdown, updatePosition],
  );

  useEffect(() => {
    const listener = (id) => {
      if (id === null) {
        setActiveId(null);
        setSearch("");
        triggerRef.current = null;
      }
    };
    globalCloseListeners.add(listener);
    return () => globalCloseListeners.delete(listener);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [activeId, updatePosition]);

  return {
    activeId,
    position,
    search,
    setSearch,
    toggleDropdown,
    closeDropdown,
  };
}

// Alias for portal-consistent naming
export const useDropdownPortal = useDropdown;
