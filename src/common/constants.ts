import * as dotenv from 'dotenv';
dotenv.config();

export const STORAGE_PATH = 'public/storage';

export const HTTP_SUCCESS_GET = 200;
export const HTTP_SUCCESS_POST = 201;
export const HTTP_INTERNAL_SERVER = 500;
export const HTTP_UNPROCESSABLE = 422;
export const HTTP_CONFLICT = 409;
export const HTTP_NOT_FOUND = 404;
export const HTTP_FORBIDDEN = 403;
export const HTTP_UNAUTHORIZE = 401;
export const HTTP_BAD_REQUEST = 400;

export enum DeviceTypes {
  ANDROID = 'Android',
  IOS = 'iOS',
  WEB = 'Web',
}

export enum PROVIDER_TYPES {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

export enum Operations {
  CREATE = 'Create',
  READ = 'Read',
  UPDATE = 'Update',
  DELETE = 'Delete',
  ASSIGN = 'Assign',
  TEMPLATIZE = 'Templatize',
}

export enum PermissionModules {
  TASK_MODULE = 'Task Module',
  USER_MODULE = 'User Module',
  TEAM_MODULE = 'Team Module',
}

export enum EXPORT_FILENAME {
  ACADEMICYEAR_MODULE = 'academic_year',
  TASK_MODULE = 'task',
  USER_MODULE = 'user',
  TEAM_MODULE = 'team',
}

export enum SENDGRID_TEMPLATES {
  TASK_REMINDER = 'd-9ec191f26dc046789a1462d81f7060fc',
  TASK_ASSIGNMENT = 'd-e20cedb5a3ab407ba563c716bbddf500',
  TASK_REPETITION = 'd-0be203b5b63e456887f201330f00ea4e',
}
