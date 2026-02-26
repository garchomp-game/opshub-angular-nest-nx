import { WorkflowStatus } from '../enums/workflow-status.enum';
import { ProjectStatus } from '../enums/project-status.enum';
import { TaskStatus } from '../enums/task-status.enum';
import { InvoiceStatus } from '../enums/invoice-status.enum';

export const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
    [WorkflowStatus.DRAFT]: [WorkflowStatus.SUBMITTED],
    [WorkflowStatus.SUBMITTED]: [WorkflowStatus.APPROVED, WorkflowStatus.REJECTED, WorkflowStatus.WITHDRAWN],
    [WorkflowStatus.REJECTED]: [WorkflowStatus.SUBMITTED, WorkflowStatus.WITHDRAWN],
    [WorkflowStatus.APPROVED]: [],
    [WorkflowStatus.WITHDRAWN]: [],
};

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
    [ProjectStatus.PLANNING]: [ProjectStatus.ACTIVE, ProjectStatus.CANCELLED],
    [ProjectStatus.ACTIVE]: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
    [ProjectStatus.COMPLETED]: [],
    [ProjectStatus.CANCELLED]: [],
};

export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE],
    [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    [InvoiceStatus.DRAFT]: [InvoiceStatus.SENT, InvoiceStatus.CANCELLED],
    [InvoiceStatus.SENT]: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
    [InvoiceStatus.PAID]: [],
    [InvoiceStatus.CANCELLED]: [],
};

/** 遷移可否チェックヘルパー */
export function canTransition<S extends string>(
    transitions: Record<S, S[]>,
    from: S,
    to: S,
): boolean {
    return transitions[from]?.includes(to) ?? false;
}
