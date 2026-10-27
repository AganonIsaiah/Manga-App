import { Injectable, inject } from "@angular/core";
import { Observable, map, shareReplay } from "rxjs";
import { ApiClient } from "../api-client/api-client.services";
import type { SelectOption } from "../../shared/searchable-select/searchable-select";

@Injectable({ providedIn: "root" })
export class LocationsService {
  private readonly api = inject(ApiClient);
  private readonly cities = this.api
    .assetJson<Record<string, string[]>>("/locations/cities.json")
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));
  getCities(country: string): Observable<SelectOption[]> {
    return this.cities.pipe(
      map((index) =>
        (index[country] ?? []).map((name) => ({ value: name, label: name })),
      ),
    );
  }
}
