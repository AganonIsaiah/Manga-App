import type { TestComponentRenderer } from "@angular/core/testing";

// Attribute-selector components need their native host (dialog/article), rather
// than TestBed's default div, to exercise the browser APIs they rely on.
export function createRendererMock(tag: string): TestComponentRenderer {
  const roots: HTMLElement[] = [];
  return {
    insertRootElement(id: string) {
      const element = document.createElement(tag);
      element.id = id;
      roots.push(element);
      document.body.append(element);
    },
    removeAllRootElements() {
      for (const element of roots) element.remove();
      roots.length = 0;
    },
  };
}
