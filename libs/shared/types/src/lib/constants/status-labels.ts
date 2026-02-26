import { UserStatus } from '../enums/user-status.enum';
import { ProjectStatus } from '../enums/project-status.enum';
import { TaskStatus } from '../enums/task-status.enum';
import { WorkflowStatus } from '../enums/workflow-status.enum';

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
    [UserStatus.INVITED]: '招待中',
    [UserStatus.ACTIVE]: '有効',
    [UserStatus.INACTIVE]: '無効',
};

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
    [UserStatus.INVITED]: 'accent',
    [UserStatus.ACTIVE]: 'primary',
    [UserStatus.INACTIVE]: 'warn',
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
    [WorkflowStatus.DRAFT]: '下書き',
    [WorkflowStatus.SUBMITTED]: '申請中',
    [WorkflowStatus.APPROVED]: '承認済',
    [WorkflowStatus.REJECTED]: '差戻し',
    [WorkflowStatus.WITHDRAWN]: '取下げ',
};

export const WORKFLOW_STATUS_COLORS: Record<WorkflowStatus, string> = {
    [WorkflowStatus.DRAFT]: '',
    [WorkflowStatus.SUBMITTED]: 'accent',
    [WorkflowStatus.APPROVED]: 'primary',
    [WorkflowStatus.REJECTED]: 'warn',
    [WorkflowStatus.WITHDRAWN]: '',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    [ProjectStatus.PLANNING]: '計画中',
    [ProjectStatus.ACTIVE]: '進行中',
    [ProjectStatus.COMPLETED]: '完了',
    [ProjectStatus.CANCELLED]: '中止',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
    [ProjectStatus.PLANNING]: '',
    [ProjectStatus.ACTIVE]: 'primary',
    [ProjectStatus.COMPLETED]: 'accent',
    [ProjectStatus.CANCELLED]: 'warn',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: '未着手',
    [TaskStatus.IN_PROGRESS]: '進行中',
    [TaskStatus.DONE]: '完了',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: '',
    [TaskStatus.IN_PROGRESS]: 'accent',
    [TaskStatus.DONE]: 'primary',
};
