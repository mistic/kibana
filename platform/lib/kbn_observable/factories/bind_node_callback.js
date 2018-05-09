import { Observable } from '../observable';

/**
 * Converts a Node.js-style callback API to a function that returns an
 * Observable.
 *
 * Does NOT handle functions whose callbacks have
 * more than two parameters. Only the first value after the
 * error argument will be returned.
 *
 * Example: Read a file from the filesystem and get the data as an Observable:
 *
 *     import fs from 'fs';
 *     var readFileAsObservable = $bindNodeCallback(fs.readFile);
 *     var result = readFileAsObservable('./roadNames.txt', 'utf8');
 *     result.subscribe(
 *       x => console.log(x),
 *       e => console.error(e)
 *     );
 */
export function $bindNodeCallback(callbackFunc) {
  return function(...args) {
    const context = this;

    return new Observable(observer => {
      function handlerFn(err, val, ...rest) {
        if (err != null) {
          observer.error(err);
        } else if (rest.length > 0) {
          // If we've received more than two arguments, the function doesn't
          // follow the common Node.js callback style. We could return an array
          // if that happened, but as most code follow the pattern we don't
          // special case it for now.
          observer.error(new Error('Node callback called with too many args'));
        } else {
          observer.next(val);
          observer.complete();
        }
      }

      callbackFunc.apply(context, args.concat([handlerFn]));
    });
  };
}
