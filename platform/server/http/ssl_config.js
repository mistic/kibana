import crypto from 'crypto';
import { schema } from '@kbn/utils';

const { object, boolean, string, arrayOf, oneOf, literal, maybe } = schema;

const protocolMap = new Map([
  ['TLSv1', crypto.constants.SSL_OP_NO_TLSv1],
  ['TLSv1.1', crypto.constants.SSL_OP_NO_TLSv1_1],
  ['TLSv1.2', crypto.constants.SSL_OP_NO_TLSv1_2],
]);

const sslSchema = object(
  {
    enabled: boolean({
      defaultValue: false,
    }),
    certificate: maybe(string()),
    key: maybe(string()),
    keyPassphrase: maybe(string()),
    certificateAuthorities: maybe(oneOf([arrayOf(string()), string()])),
    supportedProtocols: maybe(
      arrayOf(oneOf([literal('TLSv1'), literal('TLSv1.1'), literal('TLSv1.2')]))
    ),
    cipherSuites: arrayOf(string(), {
      defaultValue: crypto.constants.defaultCoreCipherList.split(':'),
    }),
  },
  {
    validate: ssl => {
      if (ssl.enabled && (!ssl.key || !ssl.certificate)) {
        return 'must specify [certificate] and [key] when ssl is enabled';
      }
    },
  }
);

function initCertificateAuthorities(certificateAuthorities) {
  if (
    certificateAuthorities === undefined ||
    Array.isArray(certificateAuthorities)
  ) {
    return certificateAuthorities;
  }

  return [certificateAuthorities];
}

export class SslConfig {
  /**
   * @internal
   */
  static schema = sslSchema;

  /**
   * @type {boolean}
   */
  enabled;

  /**
   * @type {?string}
   */
  key;

  /**
   * @type {?string}
   */
  certificate;

  /**
   * @type {?string[]}
   */
  certificateAuthorities;

  /**
   * @type {?string}
   */
  keyPassphrase;

  /**
   * @type {string[]}
   */
  cipherSuites;

  /**
   * @type {?string[]}
   */
  supportedProtocols;

  constructor(config) {
    this.enabled = config.enabled;
    this.key = config.key;
    this.certificate = config.certificate;
    this.certificateAuthorities = initCertificateAuthorities(
      config.certificateAuthorities
    );
    this.keyPassphrase = config.keyPassphrase;
    this.cipherSuites = config.cipherSuites;
    this.supportedProtocols = config.supportedProtocols;
  }

  /**
   * Options that affect the OpenSSL protocol behavior via numeric bitmask of the SSL_OP_*
   * options from OpenSSL Options.
   */
  getSecureOptions() {
    if (
      this.supportedProtocols === undefined ||
      this.supportedProtocols.length === 0
    ) {
      return 0;
    }

    const supportedProtocols = this.supportedProtocols;
    return Array.from(protocolMap).reduce(
      (secureOptions, [protocolAlias, secureOption]) => {
        // `secureOption` is the option that turns *off* support for a particular protocol,
        // so if protocol is supported, we should not enable this option.
        return supportedProtocols.includes(protocolAlias)
          ? secureOptions
          : secureOptions | secureOption;
      },
      0
    );
  }
}
