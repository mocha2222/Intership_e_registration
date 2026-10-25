import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as fs from 'fs/promises';
import { ResponsesService } from './responses.service';
import { CreateResponseDto } from './dto/create-response.dto';

jest.mock('fs/promises', () => ({ mkdir: jest.fn(), writeFile: jest.fn() }));

describe('Single formData submission', () => {
  let service: ResponsesService;
  let form: any;
  let forms: any;
  let responses: any;

  beforeEach(() => {
    jest.clearAllMocks();
    form = {
      id: 12, status: 'enabled', pages: [{ elements: [
        { id: 1, type: 'shorttext', label: 'Full name' },
        { id: 2, type: 'fileupload', label: 'Upload CV' },
        { id: 3, type: 'number', label: 'Count' },
        { id: 4, type: 'image', label: 'Image' },
      ] }],
      attendance: { attendanceEnabled: true },
    };
    forms = { findOne: jest.fn().mockResolvedValue(form) };
    responses = {
      create: jest.fn(data => ({ id: 'response-id', ...data })),
      save: jest.fn(async data => data),
      count: jest.fn().mockResolvedValue(0),
    };
    const attendance: any = { generateQRToken: jest.fn().mockReturnValue('qr-token') };
    service = new ResponsesService(responses, forms, attendance);
  });

  function fileEntry() {
    return { label: 'Upload CV', type: 'fileupload', value: {
      name: 'cv.pdf', data: 'data:application/pdf;base64,aGVsbG8=',
    } };
  }

  it('saves ordinary answers, zero and the server label without an answers dictionary', async () => {
    const result = await service.submit('public-token', { formData: {
      el_1: { label: 'Browser label', type: 'shorttext', value: 'Dara' },
      el_3: { label: 'Count', type: 'number', value: 0 },
    } });
    expect(forms.findOne).toHaveBeenCalledWith({
      where: { shareToken: 'public-token' },
      relations: ['settings', 'attendance'],
    });
    expect(responses.create).toHaveBeenCalledWith(expect.objectContaining({ formData: {
      el_1: { label: 'Full name', value: 'Dara' },
      el_3: { label: 'Count', value: 0 },
    } }));
    expect(result.qrToken).toBe('qr-token');
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('does not generate or save a QR token when attendance is disabled', async () => {
    form.attendance = { attendanceEnabled: false };

    const result = await service.submit('public-token', { formData: {
      el_1: { label: 'Full name', type: 'shorttext', value: 'Dara' },
    } });

    expect(result.qrToken).toBeNull();
    expect(responses.create).toHaveBeenCalledWith(expect.objectContaining({ qrToken: null }));
    expect(responses.save).toHaveBeenCalledTimes(1);
  });

  it('saves a file and stores the existing JSON-string metadata shape', async () => {
    await service.submit('public-token', { formData: { el_2: fileEntry() } });
    expect(fs.writeFile).toHaveBeenCalledWith(expect.stringMatching(/\.pdf$/), Buffer.from('hello'));
    const saved = responses.create.mock.calls[0][0].formData.el_2;
    const metadata = JSON.parse(saved.value);
    expect(saved.label).toBe('Upload CV');
    expect(metadata.fileName).toBe('cv.pdf');
    expect(metadata.fileUrl).toMatch(/^\/uploads\/12\/responses\/[a-f0-9]+\.pdf$/);
    expect(metadata.data).toBeUndefined();
  });

  it('saves multiple uploaded files for one field', async () => {
    const first = fileEntry();
    const second = { label: 'Upload CV', type: 'fileupload', value: {
      name: 'portfolio.txt', data: 'data:text/plain;base64,d29ybGQ=',
    } };

    await service.submit('public-token', { formData: {
      el_2: { label: 'Upload CV', type: 'fileupload', value: [first.value, second.value] },
    } });

    expect(fs.writeFile).toHaveBeenCalledTimes(2);
    const saved = responses.create.mock.calls[0][0].formData.el_2;
    const metadata = JSON.parse(saved.value);
    expect(metadata).toHaveLength(2);
    expect(metadata.map(file => file.fileName)).toEqual(['cv.pdf', 'portfolio.txt']);
  });

  it('supports an empty uploaded file', async () => {
    const entry = fileEntry();
    entry.value.data = 'data:application/pdf;base64,';
    await service.submit('public-token', { formData: { el_2: entry } });
    expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), Buffer.alloc(0));
  });

  it('processes an image upload through the same path', async () => {
    const entry = fileEntry();
    entry.type = 'image';
    await service.submit('public-token', { formData: { el_4: entry } });
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('keeps empty optional file answers empty', async () => {
    await service.submit('public-token', { formData: {
      el_2: { label: 'Upload CV', type: 'fileupload', value: '' },
    } });
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(responses.create.mock.calls[0][0].formData.el_2.value).toBe('');
  });

  it('rejects an unknown field before writing any files', async () => {
    await expect(service.submit('public-token', { formData: {
      el_2: fileEntry(), el_99: { label: 'Unknown', type: 'shorttext', value: 'x' },
    } })).rejects.toThrow(BadRequestException);
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(responses.save).not.toHaveBeenCalled();
  });

  it('rejects a forged field type', async () => {
    await expect(service.submit('public-token', { formData: { el_1: fileEntry() } })).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid base64 instead of silently saving a filename', async () => {
    const entry = fileEntry();
    entry.value.data = 'data:application/pdf;base64,%%%';
    await expect(service.submit('public-token', { formData: { el_2: entry } })).rejects.toThrow(BadRequestException);
    expect(responses.save).not.toHaveBeenCalled();
  });

  it('rejects a filename-only upload', async () => {
    await expect(service.submit('public-token', { formData: {
      el_2: { label: 'Upload CV', type: 'fileupload', value: 'cv.pdf' },
    } })).rejects.toThrow(BadRequestException);
  });

  it('rejects an object for an ordinary answer', async () => {
    await expect(service.submit('public-token', { formData: {
      el_1: { label: 'Full name', type: 'shorttext', value: fileEntry().value },
    } })).rejects.toThrow(BadRequestException);
  });

  it('still rejects disabled forms and numeric public identifiers', async () => {
    form.status = 'disabled';
    await expect(service.submit('public-token', { formData: {} })).rejects.toThrow('disabled');
    await expect(service.submit('12', { formData: {} })).rejects.toThrow('Form not found');
    expect(responses.save).not.toHaveBeenCalled();
  });

  it('keeps the old response-count limit check', async () => {
    form.status = 'disable_limit';
    form.settings = { submissionLimit: 1 };
    responses.count.mockResolvedValue(1);
    await expect(service.submit('public-token', { formData: {} })).rejects.toThrow('submission limit');
  });

  it('does not save a response when writing the file fails', async () => {
    jest.mocked(fs.writeFile).mockRejectedValueOnce(new Error('Disk full'));
    await expect(service.submit('public-token', { formData: { el_2: fileEntry() } })).rejects.toThrow('Disk full');
    expect(responses.save).not.toHaveBeenCalled();
  });

  describe('request DTO validation', () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    const metadata = { type: 'body' as const, metatype: CreateResponseDto };

    it('accepts the single formData property', async () => {
      await expect(pipe.transform({ formData: {} }, metadata)).resolves.toBeInstanceOf(CreateResponseDto);
    });

    it.each([{ answers: {} }, { answers: {}, formData: {} }, { formData: [] }, {}])(
      'rejects legacy or malformed body %j', async body => {
        await expect(pipe.transform(body, metadata)).rejects.toThrow(BadRequestException);
      },
    );
  });
});
