import { expect, it, vi } from "vitest";
import { SearchableSelect } from "./searchable-select";
import { renderComponent } from "../../../../tests/render-component";

const options = [
  { value: "CA", label: "Canada" },
  { value: "FR", label: "France" },
  { value: "MX", label: "México" },
];
it("filters labels without accents and supports arrow/enter selection", async () => {
  const { fixture, element, stable } = await renderComponent(SearchableSelect, {
    inputId: "country",
    label: "Country",
    options,
  });
  const component = fixture.componentInstance;
  const selected = vi.spyOn(component.selected, "emit");
  const input = element.querySelector("input")!;
  input.dispatchEvent(new FocusEvent("focus"));
  input.value = "mex";
  input.dispatchEvent(new Event("input"));
  await stable();
  expect(component.matches()).toEqual([options[2]]);
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  expect(selected).toHaveBeenCalledWith("MX");
  expect(component.open()).toBe(false);
});
it("retains a selected country on escape/blur and allows clearing", async () => {
  const { fixture } = await renderComponent(SearchableSelect, {
    inputId: "country",
    label: "Country",
    options,
    value: "CA",
  });
  const component = fixture.componentInstance;
  const selected = vi.spyOn(component.selected, "emit");
  component.show();
  component.text.set("invalid country");
  component.blur();
  expect(selected).toHaveBeenCalledWith("CA");
  expect(component.text()).toBe("Canada");
  component.show();
  component.keydown(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(component.text()).toBe("Canada");
  component.choose("");
  expect(selected).toHaveBeenCalledWith("");
});
it("accepts a missing city and keeps typed text when suggestions finish loading", async () => {
  const { fixture, stable } = await renderComponent(SearchableSelect, {
    inputId: "city",
    label: "City",
    allowCustom: true,
  });
  const component = fixture.componentInstance;
  const selected = vi.spyOn(component.selected, "emit");
  component.show();
  component.text.set("My hometown");
  fixture.componentRef.setInput("options", [
    { value: "Toronto", label: "Toronto" },
  ]);
  await stable();
  expect(component.text()).toBe("My hometown");
  expect(component.choices()[0].label).toBe("Use “My hometown”");
  component.blur();
  expect(selected).toHaveBeenCalledWith("My hometown");
});
