import { describe, it, expect } from 'vitest'
import { ASPIRIN_SAMPLE } from '@/store'
import {
  BPD_APP_VERSION,
  BPD_FILE_VERSION,
  BpdParseError,
  parseBpd,
  serializeProject,
} from './bpd'

describe('bpd serialize/parse', () => {
  it('wraps a project with exactly the four top-level keys', () => {
    const file = serializeProject(ASPIRIN_SAMPLE)
    expect(Object.keys(file).sort()).toEqual(['appVersion', 'createdAt', 'fileVersion', 'project'])
    expect(file.fileVersion).toBe(BPD_FILE_VERSION)
    expect(file.appVersion).toBe(BPD_APP_VERSION)
  })

  it('round-trips a project deep-equal (ignoring createdAt)', () => {
    const text = JSON.stringify(serializeProject(ASPIRIN_SAMPLE))
    const { project } = parseBpd(text)
    expect(project).toEqual(ASPIRIN_SAMPLE)
  })

  it('rejects malformed JSON', () => {
    expect(() => parseBpd('{not json')).toThrow(BpdParseError)
  })

  it('rejects an unsupported fileVersion', () => {
    const text = JSON.stringify({
      fileVersion: '9.9.9',
      appVersion: 'x',
      createdAt: '',
      project: ASPIRIN_SAMPLE,
    })
    expect(() => parseBpd(text)).toThrow(/Unsupported .bpd fileVersion/)
  })

  it('rejects a bad wrapper (missing project)', () => {
    const text = JSON.stringify({ fileVersion: BPD_FILE_VERSION, appVersion: 'x', createdAt: '' })
    expect(() => parseBpd(text)).toThrow(BpdParseError)
  })
})
