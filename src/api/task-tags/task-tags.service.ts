import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagsService } from '../tags/tags.service';
import { Task } from '../tasks/entities/task.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceService } from '../workspaces/workspace.service';
import { TaskTag } from './entities/task-tag.entity';

@Injectable()
export class TaskTagsService {
  constructor(
    @InjectRepository(TaskTag)
    private readonly taskTagRepo: Repository<TaskTag>,

    private tagsService: TagsService,
    private workspaceService: WorkspaceService,
  ) {}

  /**
   * Create tags
   * @param tags
   * @param task
   * @param workspace
   * @returns
   */
  async createOrUpdate(
    reuqestedTags: Array<string>,
    workspace: Workspace,
    task: Task,
  ) {
    const tags = reuqestedTags.filter(
      (value, index, array) => array.indexOf(value) === index,
    );

    // console.log('===start===========');
    // console.log('createOrUpdate tags', tags);

    const newT = tags.map((t) => t.trim());

    const createdTags = await this.tagsService.create(newT, workspace);

    // console.log('createdTags tags', createdTags);

    await Promise.all(
      createdTags.map(async (tag) => {
        const isExists = await this.findByTaskAndTag(task.id, tag.tag.trim());

        if (!isExists)
          return this.taskTagRepo.save(
            this.taskTagRepo.create({
              task: { id: task.id },
              tag: { id: tag.id },
            }),
          );
      }),
    );

    const existingTags = await this.findTaskTagsByWorkspace(
      task.id,
      tags,
      workspace,
    );

    // console.log('existingTags tags', existingTags);

    const existingTaskTagValues = existingTags.map((tt) => tt.tag.tag);

    // console.log('existingTaskTagValues tags', existingTaskTagValues);

    const existsTagsToDelete = createdTags.map((t) => t.tag);

    const oldTagsToDelete = existingTaskTagValues
      .map((tag) => !existsTagsToDelete.includes(tag) && tag)
      .filter((t) => t);

    if (oldTagsToDelete.length) {
      await Promise.all(
        oldTagsToDelete.map(async (tag) => {
          const isExists = await this.findByTaskAndTag(task.id, tag);

          if (isExists) return this.taskTagRepo.remove(isExists);
        }),
      );
    }
    // console.log('=====end ==========');
  }

  /**
   * Find task tags
   * @param taskId
   * @param tags
   * @returns
   */
  async findTaskTags(taskId: number) {
    const tags = await this.taskTagRepo
      .createQueryBuilder('tt')
      .leftJoinAndSelect('tt.tag', 't')
      .where('taskId = :taskId', { taskId })
      .getMany();

    return tags.map((tt) => tt.tag.tag);
  }

  /**
   * Find task tags
   * @param taskId
   * @param tags
   * @returns
   */
  async findTaskTagsByWorkspace(
    taskId: number,
    tags: Array<string>,
    workspace: Workspace,
  ) {
    return (
      this.taskTagRepo
        .createQueryBuilder('tt')
        .leftJoinAndSelect('tt.tag', 't')
        .where('taskId = :taskId', { taskId })
        .andWhere('workspaceId = :workspaceId', { workspaceId: workspace.id })
        // .andWhere('tags IN (...:tags)', { tags })
        .getMany()
    );
  }

  /**
   * Find by task and tag
   */
  async findByTaskAndTag(taskId: number, tag: string) {
    return this.taskTagRepo
      .createQueryBuilder('tt')
      .leftJoinAndSelect('tt.tag', 'tag')
      .where('taskId = :taskId', { taskId })
      .andWhere('tag.tag = :tag', { tag })
      .getOne();
  }
}
