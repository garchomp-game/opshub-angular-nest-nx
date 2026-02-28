import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loadByProject が GET /api/projects/:id/tasks を呼ぶこと', () => {
    service.loadByProject('proj-001');

    const req = httpMock.expectOne('/api/projects/proj-001/tasks');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [{ id: 'task-001', title: 'タスク' }] });

    expect(service.tasks()).toHaveLength(1);
  });

  it('create が POST /api/projects/:id/tasks を呼ぶこと', () => {
    service.create('proj-001', { title: '新タスク' }).subscribe();

    const req = httpMock.expectOne('/api/projects/proj-001/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: '新タスク' });
    req.flush({ success: true, data: { id: 'task-new', title: '新タスク' } });
  });

  it('update が PUT /api/tasks/:id を呼ぶこと', () => {
    service.update('task-001', { title: '更新タスク' }).subscribe();

    const req = httpMock.expectOne('/api/tasks/task-001');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, data: { id: 'task-001' } });
  });

  it('changeStatus が PATCH /api/tasks/:id/status を呼ぶこと', () => {
    service.changeStatus('task-001', 'in_progress').subscribe();

    const req = httpMock.expectOne('/api/tasks/task-001/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'in_progress' });
    req.flush({ success: true, data: { id: 'task-001', status: 'in_progress' } });
  });

  it('remove が DELETE /api/tasks/:id を呼ぶこと', () => {
    service.remove('task-001').subscribe();

    const req = httpMock.expectOne('/api/tasks/task-001');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: {} });
  });
});
