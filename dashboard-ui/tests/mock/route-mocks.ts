import { BehaviorSubject } from "rxjs";
import { convertToParamMap, type Params } from "@angular/router";

export function createRouteMock(initial: Params = {}) {
  const params = new BehaviorSubject(convertToParamMap(initial));
  let queryParams = initial;
  return {
    queryParamMap: params.asObservable(),
    get snapshot() {
      return { queryParamMap: params.value, queryParams };
    },
    setQuery(next: Params) {
      queryParams = next;
      params.next(convertToParamMap(next));
    },
  };
}
