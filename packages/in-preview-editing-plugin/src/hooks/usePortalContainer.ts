import { useMemo } from 'react';
import { usePluginContext } from '../context/PluginContext.tsx';

/**
 * Hook to get or create a portal container in the shadow DOM
 * @param containerId - The ID of the container element (default: 'ipe-portal-container')
 * @returns The container element in the shadow DOM
 */
export const usePortalContainer = (containerId: string = 'ipe-portal-container'): HTMLDivElement => {
  const { shadowRoot } = usePluginContext();

  return useMemo(() => {
    // Check if container already exists
    let container = shadowRoot.querySelector(`#${containerId}`) as HTMLDivElement;
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      shadowRoot.appendChild(container);
    }
    return container;
  }, [shadowRoot, containerId]);
};


