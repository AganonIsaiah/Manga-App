import { Subject } from "rxjs";

export function pendingRequest<T>() {
  const subject = new Subject<T>();
  return {
    stream: subject.asObservable(),
    observed: () => subject.observed,
    resolve(value: T) {
      subject.next(value);
      subject.complete();
    },
    reject(error: Error) {
      subject.error(error);
    },
  };
}
