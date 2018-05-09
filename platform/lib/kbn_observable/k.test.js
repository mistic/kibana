import { Observable } from './observable';
import { k$ } from './k';

const plus1 = source =>
  new Observable(observer => {
    source.subscribe({
      next(val) {
        observer.next(val + 1);
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      },
    });
  });

const toString = source =>
  new Observable(observer => {
    source.subscribe({
      next(val) {
        observer.next(val.toString());
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      },
    });
  });

const toPromise = source =>
  new Promise((resolve, reject) => {
    let lastValue;

    source.subscribe({
      next(value) {
        lastValue = value;
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(lastValue);
      },
    });
  });

test('observable to observable', () => {
  const numbers$ = Observable.of(1, 2, 3);
  const actual = [];

  k$(numbers$)(plus1, toString).subscribe({
    next(x) {
      actual.push(x);
    },
  });

  expect(actual).toEqual(['2', '3', '4']);
});

test('observable to promise', async () => {
  const numbers$ = Observable.of(1, 2, 3);

  const value = await k$(numbers$)(plus1, toPromise);

  expect(value).toEqual(4);
});
