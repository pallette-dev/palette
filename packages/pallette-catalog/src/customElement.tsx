import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { PalletteCatalogComponents, PallettePreview } from "@pallette/core";
import { PalletteCatalog } from "./PalletteCatalog";

const DEFAULT_TAG = "pallette-catalog";

/**
 * Define a custom element that renders {@link PalletteCatalog}.
 * Set `components`, `registry`, and `preview` as **properties** (not HTML attributes).
 */
export function registerPalletteCatalog(tagName: string = DEFAULT_TAG): void {
  if (customElements.get(tagName)) {
    return;
  }

  class PalletteCatalogElement extends HTMLElement {
    _root: Root | null = null;
    _components: PalletteCatalogComponents | null = null;
    _registry: unknown = undefined;
    _preview: PallettePreview | null = null;

    connectedCallback(): void {
      if (!this._root) {
        this._root = createRoot(this);
      }
      this.#render();
    }

    disconnectedCallback(): void {
      this._root?.unmount();
      this._root = null;
    }

    set components(value: PalletteCatalogComponents | null) {
      this._components = value;
      this.#render();
    }
    get components(): PalletteCatalogComponents | null {
      return this._components;
    }

    set registry(value: unknown) {
      this._registry = value;
      this.#render();
    }
    get registry(): unknown {
      return this._registry;
    }

    set preview(value: PallettePreview | null) {
      this._preview = value;
      this.#render();
    }
    get preview(): PallettePreview | null {
      return this._preview;
    }

    #render(): void {
      if (!this._root) {
        return;
      }
      const { _components, _registry, _preview } = this;
      if (!_components || _preview == null) {
        this._root.render(
          <StrictMode>
            <div style={{ padding: 16, fontFamily: "sans-serif", fontSize: 14 }}>
              Set <code>components</code>, <code>registry</code>, and{" "}
              <code>preview</code> on <code>&lt;{DEFAULT_TAG}&gt;</code>.
            </div>
          </StrictMode>,
        );
        return;
      }
      this._root.render(
        <StrictMode>
          <PalletteCatalog
            components={_components}
            registry={_registry}
            preview={_preview}
          />
        </StrictMode>,
      );
    }
  }

  customElements.define(tagName, PalletteCatalogElement);
}
