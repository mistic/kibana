# kbn-internal-native-observable

This package contains a [spec-compliant][spec] observable implementation that
does _not_ implement any additional helper methods on the observable.

NB! It is not intended to be used directly. It is exposed through
`../kbn_observable`, which also exposes several helpers, similar to a subset of
features in RxJS.

## Background

We only want to expose native JavaScript observables in the api, i.e. exposed
observables should _only_ implement the specific methods defined in the spec.
The primary reason for doing this is that we don't want to couple our plugin
api to a specific version of RxJS (or any other observable library that
implements additional methods on top of the spec).

As there exists no other library we can use in the interim while waiting for the
Observable spec to reach stage 3, all exposed observables in the Kibana platform
should rely on this package.

[spec]: https://github.com/tc39/proposal-observable
