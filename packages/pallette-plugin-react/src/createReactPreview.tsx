import type { PallettePreview } from "@pallette/core";
import type { Spec } from "@json-render/core";
import {
  ActionProvider,
  Renderer,
  StateProvider,
  ValidationProvider,
  VisibilityProvider,
} from "@json-render/react";
import type { ComponentRegistry } from "@json-render/react";
import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";

function PreviewTree({
  spec,
  registry,
}: {
  spec: Spec;
  registry: ComponentRegistry;
}) {
  return (
    <StateProvider initialState={{}}>
      <VisibilityProvider>
        <ActionProvider handlers={{}}>
          <ValidationProvider>
            <Renderer spec={spec} registry={registry} />
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}

/**
 * Preview runtime for `@json-render/react`. Pair with a registry from `defineRegistry`.
 */
export function createReactPreview(): PallettePreview {
  let root: Root | null = null;

  return {
    mount(container, { spec, registry }) {
      if (root) {
        root.unmount();
        root = null;
      }
      root = createRoot(container);
      const reg = registry as ComponentRegistry;
      if (!spec) {
        root.render(
          <StrictMode>
            <div style={{ padding: 12, fontSize: 13, color: "#666" }}>No preview spec.</div>
          </StrictMode>,
        );
        return;
      }
      root.render(
        <StrictMode>
          <PreviewTree spec={spec} registry={reg} />
        </StrictMode>,
      );
    },
    unmount() {
      root?.unmount();
      root = null;
    },
  };
}
