import { afterEach, describe, expect, it, vi } from 'vitest'
import { resize } from './image'

afterEach(() => vi.restoreAllMocks())

describe('resize', () => {
  it('canvas를 JPEG data URL로 출력하고 크기를 제한한다', async () => {
    const drawImage = vi.fn()
    const toDataURL = vi.fn(() => 'data:image/jpeg;base64,test')
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 2000, height: 1000, close: vi.fn() })))
    vi.stubGlobal('document', { createElement: vi.fn(() => ({ width: 0, height: 0, getContext: () => ({ drawImage }), toDataURL })) })
    const output = await resize(new File(['bytes'], 'test.jpg', { type: 'image/jpeg' }))
    expect(output).toBe('data:image/jpeg;base64,test')
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.85)
    expect(drawImage).toHaveBeenCalled()
  })
  it('읽지 못하는 형식을 한국어 오류로 거부한다', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error()))
    await expect(resize(new File(['bytes'], 'test.heic'))).rejects.toThrow('이 사진 형식은 쓸 수 없어요. JPG나 PNG로 올려주세요')
  })
})
