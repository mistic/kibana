import { Observable } from '../observable';

export function $error(error) {
  return new Observable(observer => {
    observer.error(error);
  });
}
