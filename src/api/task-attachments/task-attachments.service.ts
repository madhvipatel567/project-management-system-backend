import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { generateUniqueId } from 'src/common/helper/common.helper';
import {
  copyFiles,
  deleteFile,
  docFileFilter,
  imageFileFilter,
  pdfFileFilter,
  uploadFiles,
  videoFileFilter,
} from 'src/common/helper/fileupload.helper';
import { IUploadedFile } from 'src/common/interfaces/uploaded-file.interface';
import { Repository } from 'typeorm';
import { activityType } from '../task-activities/entities/task-activity.entity';
import { TaskActivitiesService } from '../task-activities/task-activities.service';
import { Task } from '../tasks/entities/task.entity';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto';
import { TaskAttachment } from './entities/task-attachment.entity';

@Injectable()
export class TaskAttachmentsService {
  constructor(
    @InjectRepository(TaskAttachment)
    private readonly taskAttachmentRepo: Repository<TaskAttachment>,

    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: TasksService,

    private taskActivitiesService: TaskActivitiesService,
  ) {}

  /**
   * store attachments
   */
  async create(
    createTaskAttachmentDto: CreateTaskAttachmentDto,
    authUser,
    attachments?: IUploadedFile[],
  ) {
    const task = await this.tasksService.findOneByUniqueId(
      createTaskAttachmentDto.taskUniqueId,
    );

    if (!task) throw new BadRequestException('Task not found');

    if (attachments && attachments.length) {
      const { isSizeValid, isExtensionValid } = await this.checkValidFile(
        attachments,
      );
      if (!isSizeValid)
        throw new BadRequestException('Upload files less than 25mb');

      if (!isExtensionValid)
        throw new BadRequestException(
          'Only images, PDFs, documents, and videos are allowed.',
        );
    }

    if (attachments && attachments.length) {
      const taskAttachements = await this.uploadTaskDocuments(
        task,
        attachments,
        true,
      );

      await this.taskActivitiesService.create(
        `<b>${authUser.name}</b> has uploaded ${
          attachments.length === 1
            ? ' required attachment'
            : `${attachments.length} required attachments`
        }  - <b>${attachments.map(
          (attachment) => attachment.originalname + ' ',
        )}</b>.`,
        activityType.TASK_ATTACHEMNT_UPLOADED,
        task,
        authUser,
      );

      return taskAttachements;
    }

    return this.findAllByTaskId(task.id, true);
  }

  /**
   * Upload documents
   * @param task
   * @param attachments
   */
  async uploadTaskDocuments(
    task: Task,
    attachments: IUploadedFile[],
    isTaskCompletedAttachment?: boolean,
  ) {
    const files = await uploadFiles(
      'tasks',
      attachments,
      isTaskCompletedAttachment,
    );

    const uploadedAttachments = await Promise.all(
      files.map(async (fileInfo) => {
        const attachmentUniqueId = await generateUniqueId('TA');

        return this.taskAttachmentRepo.save(
          this.taskAttachmentRepo.create({
            task: { id: task.id },
            attachmentUniqueId,
            ...fileInfo,
          }),
        );
      }),
    );

    return uploadedAttachments;
  }

  /**
   * Upload documents
   * @param task
   * @param attachments
   */
  async copyTaskDocuments(task: Task, taskAttachements) {
    const files = await copyFiles('tasks', taskAttachements);

    await Promise.all(
      files.map(async (fileInfo) => {
        const attachmentUniqueId = await generateUniqueId('TA');

        return this.taskAttachmentRepo.save(
          this.taskAttachmentRepo.create({
            task: { id: task.id },
            attachmentUniqueId,
            ...fileInfo,
          }),
        );
      }),
    );
  }

  /**
   * Find all attachments for task
   * @param taskId
   * @returns
   */
  async findAllByTaskId(taskId: number, isTaskCompletedAttachment?: boolean) {
    const qb = this.taskAttachmentRepo
      .createQueryBuilder('a')
      .where('taskId =:taskId', { taskId });

    if (isTaskCompletedAttachment) {
      qb.andWhere('isTaskCompletedAttachment =:isTaskCompletedAttachment', {
        isTaskCompletedAttachment: 1,
      });
    } else {
      qb.andWhere('isTaskCompletedAttachment =:isTaskCompletedAttachment', {
        isTaskCompletedAttachment: 0,
      });
    }

    return qb.getMany();
  }

  /**
   * Find by unique id
   * @param attachmentUniqueId
   * @returns
   */
  async findOneByUniqueId(attachmentUniqueId: string) {
    return this.taskAttachmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.task', 't')
      .where('a.attachmentUniqueId =:attachmentUniqueId', {
        attachmentUniqueId,
      })
      .getOne();
  }

  /**
   * Remove attachment
   * @param attachmentUniqueId
   * @returns
   */
  async remove(authUser, attachmentUniqueId: string) {
    const attachment = await this.findOneByUniqueId(attachmentUniqueId);
    if (attachment) {
      deleteFile(attachment.media);

      const body = attachment.isTaskCompletedAttachment
        ? `<b>${authUser.name}</b> has deleted required attachment - <b>${attachment.originalname}</b>.`
        : `<b>${authUser.name}</b> has deleted attachment - <b>${attachment.originalname}</b>.`;

      await this.taskActivitiesService.create(
        body,
        activityType.TASK_ATTACHEMNT_DELETED,
        attachment.task,
        authUser,
      );

      return this.taskAttachmentRepo.remove(attachment);
    }
  }

  /**
   * Check file extensions
   * @param files
   * @returns
   */
  async checkValidFile(files: IUploadedFile[]) {
    const isValidArray = [];
    files.map((file) => {
      let isExtensionValid = false;
      let isSizeValid = true;
      if (imageFileFilter(file)) isExtensionValid = true;
      else if (docFileFilter(file)) isExtensionValid = true;
      else if (pdfFileFilter(file)) isExtensionValid = true;
      else if (videoFileFilter(file)) isExtensionValid = true;

      const mb = Number((file.size / 1048576).toFixed(2));
      if (mb > 25) {
        isSizeValid = false;
      }
      isValidArray.push({ isExtensionValid, isSizeValid });
    });

    const isExtensionValid =
      isValidArray.filter((i) => i.isExtensionValid === false).length > 0
        ? false
        : true;

    const isSizeValid =
      isValidArray.filter((i) => i.isSizeValid === false).length > 0
        ? false
        : true;
    return { isSizeValid, isExtensionValid };
  }
}
