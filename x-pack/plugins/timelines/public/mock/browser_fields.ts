/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { MappingRuntimeFields } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import type { BrowserFields } from '../../common/search_strategy/index_fields';

const DEFAULT_INDEX_PATTERN = [
  'apm-*-transaction*',
  'traces-apm*',
  'auditbeat-*',
  'endgame-*',
  'filebeat-*',
  'logs-*',
  'packetbeat-*',
  'winlogbeat-*',
];

export const mocksSource = {
  indexFields: [
    {
      category: 'base',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: '@timestamp',
      searchable: true,
      type: 'date',
      aggregatable: true,
    },
    {
      category: 'agent',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'agent.ephemeral_id',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'agent',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'agent.hostname',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'agent',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'agent.id',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'agent',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'agent.name',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'auditd',
      format: '',
      indexes: ['auditbeat'],
      name: 'auditd.data.a0',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'auditd',
      format: '',
      indexes: ['auditbeat'],
      name: 'auditd.data.a1',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'auditd',
      format: '',
      indexes: ['auditbeat'],
      name: 'auditd.data.a2',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'client',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'client.address',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'client',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'client.bytes',
      searchable: true,
      type: 'number',
      aggregatable: true,
    },
    {
      category: 'client',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'client.domain',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'client',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'client.geo.country_iso_code',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'cloud',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'cloud.account.id',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'cloud',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'cloud.availability_zone',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'container',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'container.id',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'container',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'container.image.name',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'container',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'container.image.tag',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'destination',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'destination.address',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      category: 'destination',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'destination.bytes',
      searchable: true,
      type: 'number',
      aggregatable: true,
    },
    {
      category: 'destination',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'destination.domain',
      searchable: true,
      type: 'string',
      aggregatable: true,
    },
    {
      aggregatable: true,
      category: 'destination',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'destination.ip',
      searchable: true,
      type: 'ip',
    },
    {
      aggregatable: true,
      category: 'destination',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'destination.port',
      searchable: true,
      type: 'long',
    },
    {
      aggregatable: true,
      category: 'source',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'source.ip',
      searchable: true,
      type: 'ip',
    },
    {
      aggregatable: true,
      category: 'source',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'source.port',
      searchable: true,
      type: 'long',
    },
    {
      aggregatable: true,
      category: 'event',
      format: '',
      indexes: DEFAULT_INDEX_PATTERN,
      name: 'event.end',
      searchable: true,
      type: 'date',
    },
    {
      aggregatable: false,
      category: 'nestedField',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'nestedField.firstAttributes',
      searchable: true,
      type: 'string',
      subType: {
        nested: {
          path: 'nestedField',
        },
      },
    },
    {
      aggregatable: false,
      category: 'nestedField',
      format: '',
      indexes: ['auditbeat', 'filebeat', 'packetbeat'],
      name: 'nestedField.secondAttributes',
      searchable: true,
      type: 'string',
      subType: {
        nested: {
          path: 'nestedField',
        },
      },
    },
  ],
};

export const mockIndexFields = [
  { aggregatable: true, name: '@timestamp', searchable: true, type: 'date' },
  { aggregatable: true, name: 'agent.ephemeral_id', searchable: true, type: 'string' },
  { aggregatable: true, name: 'agent.hostname', searchable: true, type: 'string' },
  { aggregatable: true, name: 'agent.id', searchable: true, type: 'string' },
  { aggregatable: true, name: 'agent.name', searchable: true, type: 'string' },
  { aggregatable: true, name: 'auditd.data.a0', searchable: true, type: 'string' },
  { aggregatable: true, name: 'auditd.data.a1', searchable: true, type: 'string' },
  { aggregatable: true, name: 'auditd.data.a2', searchable: true, type: 'string' },
  { aggregatable: true, name: 'client.address', searchable: true, type: 'string' },
  { aggregatable: true, name: 'client.bytes', searchable: true, type: 'number' },
  { aggregatable: true, name: 'client.domain', searchable: true, type: 'string' },
  { aggregatable: true, name: 'client.geo.country_iso_code', searchable: true, type: 'string' },
  { aggregatable: true, name: 'cloud.account.id', searchable: true, type: 'string' },
  { aggregatable: true, name: 'cloud.availability_zone', searchable: true, type: 'string' },
  { aggregatable: true, name: 'container.id', searchable: true, type: 'string' },
  { aggregatable: true, name: 'container.image.name', searchable: true, type: 'string' },
  { aggregatable: true, name: 'container.image.tag', searchable: true, type: 'string' },
  { aggregatable: true, name: 'destination.address', searchable: true, type: 'string' },
  { aggregatable: true, name: 'destination.bytes', searchable: true, type: 'number' },
  { aggregatable: true, name: 'destination.domain', searchable: true, type: 'string' },
  { aggregatable: true, name: 'destination.ip', searchable: true, type: 'ip' },
  { aggregatable: true, name: 'destination.port', searchable: true, type: 'long' },
  { aggregatable: true, name: 'source.ip', searchable: true, type: 'ip' },
  { aggregatable: true, name: 'source.port', searchable: true, type: 'long' },
  { aggregatable: true, name: 'event.end', searchable: true, type: 'date' },
];

export const mockBrowserFields: BrowserFields = {
  agent: {
    fields: {
      'agent.ephemeral_id': {
        aggregatable: true,
        format: '',
        name: 'agent.ephemeral_id',
        searchable: true,
        type: 'string',
      },
      'agent.hostname': {
        aggregatable: true,
        format: '',
        name: 'agent.hostname',
        searchable: true,
        type: 'string',
      },
      'agent.id': {
        aggregatable: true,
        format: '',
        name: 'agent.id',
        searchable: true,
        type: 'string',
      },
      'agent.name': {
        aggregatable: true,
        format: '',
        name: 'agent.name',
        searchable: true,
        type: 'string',
      },
    },
  },
  auditd: {
    fields: {
      'auditd.data.a0': {
        aggregatable: true,
        format: '',
        name: 'auditd.data.a0',
        searchable: true,
        type: 'string',
      },
      'auditd.data.a1': {
        aggregatable: true,
        format: '',
        name: 'auditd.data.a1',
        searchable: true,
        type: 'string',
      },
      'auditd.data.a2': {
        aggregatable: true,
        format: '',
        name: 'auditd.data.a2',
        searchable: true,
        type: 'string',
      },
    },
  },
  base: {
    fields: {
      '@timestamp': {
        aggregatable: true,
        format: '',
        name: '@timestamp',
        searchable: true,
        type: 'date',
      },
      _id: {
        name: '_id',
        type: 'string',
        searchable: true,
        aggregatable: false,
      },
      message: {
        name: 'message',
        type: 'string',
        searchable: true,
        aggregatable: false,
        format: 'string',
      },
    },
  },
  client: {
    fields: {
      'client.address': {
        aggregatable: true,
        format: '',
        name: 'client.address',
        searchable: true,
        type: 'string',
      },
      'client.bytes': {
        aggregatable: true,
        format: '',
        name: 'client.bytes',
        searchable: true,
        type: 'number',
      },
      'client.domain': {
        aggregatable: true,
        format: '',
        name: 'client.domain',
        searchable: true,
        type: 'string',
      },
      'client.geo.country_iso_code': {
        aggregatable: true,
        format: '',
        name: 'client.geo.country_iso_code',
        searchable: true,
        type: 'string',
      },
    },
  },
  cloud: {
    fields: {
      'cloud.account.id': {
        aggregatable: true,
        format: '',
        name: 'cloud.account.id',
        searchable: true,
        type: 'string',
      },
      'cloud.availability_zone': {
        aggregatable: true,
        format: '',
        name: 'cloud.availability_zone',
        searchable: true,
        type: 'string',
      },
    },
  },
  container: {
    fields: {
      'container.id': {
        aggregatable: true,
        format: '',
        name: 'container.id',
        searchable: true,
        type: 'string',
      },
      'container.image.name': {
        aggregatable: true,
        format: '',
        name: 'container.image.name',
        searchable: true,
        type: 'string',
      },
      'container.image.tag': {
        aggregatable: true,
        format: '',
        name: 'container.image.tag',
        searchable: true,
        type: 'string',
      },
    },
  },
  destination: {
    fields: {
      'destination.address': {
        aggregatable: true,
        format: '',
        name: 'destination.address',
        searchable: true,
        type: 'string',
      },
      'destination.bytes': {
        aggregatable: true,
        format: '',
        name: 'destination.bytes',
        searchable: true,
        type: 'number',
      },
      'destination.domain': {
        aggregatable: true,
        format: '',
        name: 'destination.domain',
        searchable: true,
        type: 'string',
      },
      'destination.ip': {
        aggregatable: true,
        format: '',
        name: 'destination.ip',
        searchable: true,
        type: 'ip',
      },
      'destination.port': {
        aggregatable: true,
        format: '',
        name: 'destination.port',
        searchable: true,
        type: 'long',
      },
    },
  },
  event: {
    fields: {
      'event.end': {
        format: '',
        name: 'event.end',
        searchable: true,
        type: 'date',
        aggregatable: true,
      },
      'event.action': {
        name: 'event.action',
        type: 'string',
        searchable: true,
        aggregatable: true,
        format: 'string',
      },
      'event.category': {
        name: 'event.category',
        type: 'string',
        searchable: true,
        aggregatable: true,
        format: 'string',
      },
      'event.severity': {
        name: 'event.severity',
        type: 'number',
        format: 'number',
        searchable: true,
        aggregatable: true,
      },
    },
  },
  host: {
    fields: {
      'host.name': {
        name: 'host.name',
        type: 'string',
        searchable: true,
        aggregatable: true,
        format: 'string',
      },
    },
  },
  source: {
    fields: {
      'source.ip': {
        aggregatable: true,
        format: '',
        name: 'source.ip',
        searchable: true,
        type: 'ip',
      },
      'source.port': {
        aggregatable: true,
        format: '',
        name: 'source.port',
        searchable: true,
        type: 'long',
      },
    },
  },
  user: {
    fields: {
      'user.name': {
        name: 'user.name',
        type: 'string',
        searchable: true,
        aggregatable: true,
        format: 'string',
      },
    },
  },
  nestedField: {
    fields: {
      'nestedField.firstAttributes': {
        aggregatable: false,
        format: '',
        name: 'nestedField.firstAttributes',
        searchable: true,
        type: 'string',
        subType: {
          nested: {
            path: 'nestedField',
          },
        },
      },
      'nestedField.secondAttributes': {
        aggregatable: false,
        format: '',
        name: 'nestedField.secondAttributes',
        searchable: true,
        type: 'string',
        subType: {
          nested: {
            path: 'nestedField',
          },
        },
      },
      'nestedField.thirdAttributes': {
        aggregatable: false,
        format: '',
        name: 'nestedField.thirdAttributes',
        searchable: true,
        type: 'date',
        subType: {
          nested: {
            path: 'nestedField',
          },
        },
      },
    },
  },
};

export const mockRuntimeMappings: MappingRuntimeFields = {
  '@a.runtime.field': {
    script: {
      source: 'emit("Radical dude: " + doc[\'host.name\'].value)',
    },
    type: 'keyword',
  },
};
