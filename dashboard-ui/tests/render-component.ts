import { firstValueFrom } from "rxjs";
import type { Type } from "@angular/core";
import { TestBed, TestComponentRenderer } from "@angular/core/testing";
import { ActivatedRoute, provideRouter, type Params } from "@angular/router";
import { expect } from "vitest";
import { AuthService } from "../src/app/services/auth.services";
import { HomeStore } from "../src/app/services/home-store.services";
import { createRendererMock } from "./mock/renderer-mocks";
import { createRouteMock } from "./mock/route-mocks";

export async function renderComponent<T>(
  component: Type<T>,
  inputs: Record<string, unknown> = {},
  params: Params = {},
  hostTag = "div",
  signedIn = false,
) {
  const route = createRouteMock(params);
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      { provide: TestComponentRenderer, useValue: createRendererMock(hostTag) },
      { provide: ActivatedRoute, useValue: route },
    ],
  });
  if (signedIn)
    await firstValueFrom(TestBed.inject(AuthService).signInToDemo());
  const store = TestBed.inject(HomeStore);
  TestBed.tick();
  await expect.poll(() => store.ready()).toBe(true);
  const fixture = TestBed.createComponent(component);
  for (const [name, value] of Object.entries(inputs))
    fixture.componentRef.setInput(name, value);
  const stable = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  await stable();
  const element = fixture.nativeElement as HTMLElement;
  return { fixture, element, store, route, stable };
}
