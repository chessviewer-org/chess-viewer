import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  exportFailureReason,
  runExportJobs,
  summariseExport
} from '@utils/exportJobs';

function failing(message: string, inner?: string) {
  return async () => {
    throw new Error(
      message,
      inner === undefined ? undefined : { cause: new Error(inner) }
    );
  };
}

describe('runExportJobs', () => {
  test('keeps exporting the other formats after one fails', async () => {
    const ran: string[] = [];
    const outcome = await runExportJobs([
      { label: 'PNG', run: async () => ran.push('png') },
      {
        label: 'SVG',
        run: failing('SVG export failed: wrapped', 'Vector artwork is missing')
      },
      { label: 'JPEG', run: async () => ran.push('jpeg') }
    ]);

    assert.deepEqual(ran, ['png', 'jpeg']);
    assert.deepEqual(outcome.done, ['PNG', 'JPEG']);
    assert.deepEqual(outcome.failed, [
      { label: 'SVG', reason: 'Vector artwork is missing' }
    ]);
  });

  test('stops at once when the user cancels', async () => {
    const ran: string[] = [];
    await assert.rejects(
      runExportJobs([
        { label: 'PNG', run: failing('Export cancelled') },
        { label: 'SVG', run: async () => ran.push('svg') }
      ]),
      /Export cancelled/
    );
    assert.deepEqual(ran, []);
  });
});

describe('exportFailureReason', () => {
  test('reports the innermost cause', () => {
    const error = new Error('PNG export failed: outer', {
      cause: new Error('middle', { cause: new Error('Canvas is too large') })
    });
    assert.equal(exportFailureReason(error), 'Canvas is too large');
  });

  test('accepts values that are not errors', () => {
    assert.equal(exportFailureReason('offline'), 'offline');
  });
});

describe('summariseExport', () => {
  test('success lists every saved format', () => {
    assert.deepEqual(summariseExport({ done: ['PNG', 'SVG'], failed: [] }), {
      type: 'success',
      message: 'PNG, SVG downloaded'
    });
  });

  test('partial success is a warning that names the failure', () => {
    assert.deepEqual(
      summariseExport({
        done: ['PNG'],
        failed: [{ label: 'SVG', reason: 'Vector artwork is missing' }]
      }),
      {
        type: 'warning',
        message: 'PNG downloaded. SVG failed: Vector artwork is missing'
      }
    );
  });

  test('one shared reason is reported once', () => {
    const reason = 'The black rook artwork could not be loaded.';
    assert.deepEqual(
      summariseExport({
        done: [],
        failed: ['JPEG', 'PNG', 'SVG'].map((label) => ({ label, reason }))
      }),
      { type: 'error', message: `Export failed: ${reason}` }
    );
  });

  test('nothing saved is an error', () => {
    assert.equal(
      summariseExport({
        done: [],
        failed: [{ label: 'PNG', reason: 'Canvas is too large' }]
      }).type,
      'error'
    );
  });
});
