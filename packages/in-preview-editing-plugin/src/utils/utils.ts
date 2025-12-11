/**
 * Get the current scroll position of the document.
 * @returns {{scrollLeft: number, scrollTop: number}}
 */
export function getScrollPosition() {
  return {
    scrollLeft: document.documentElement.scrollLeft,
    scrollTop: document.documentElement.scrollTop,
  };
}
