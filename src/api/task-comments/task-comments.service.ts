import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/common/decorators/permissions.decorator';
import { generateUniqueId } from 'src/common/helper/common.helper';
import { Brackets, Repository } from 'typeorm';
import { activityType } from '../task-activities/entities/task-activity.entity';
import { TaskActivitiesService } from '../task-activities/task-activities.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { TaskComment } from './entities/task-comment.entity';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly taskCommentRepo: Repository<TaskComment>,

    private tasksService: TasksService,

    private taskActivitiesService: TaskActivitiesService,
  ) {}

  /**
   * Add comment
   * @param createTaskCommentDto
   * @param authUser
   * @returns
   */
  async create(createTaskCommentDto: CreateTaskCommentDto, authUser) {
    const task = await this.tasksService.findOneByUniqueId(
      createTaskCommentDto.taskUniqueId,
    );
    if (!task) throw new BadRequestException('Task not found');

    const commentUniqueId = await generateUniqueId('C');

    const newComment = await this.taskCommentRepo.save(
      this.taskCommentRepo.create({
        ...createTaskCommentDto,
        task: { id: task.id },
        commentUniqueId,
        isPrivate: createTaskCommentDto.isPrivate === true,
        ...(authUser.role === Roles.ADMIN && {
          commentedByAdmin: { id: authUser.id },
        }),
        ...(authUser.role === Roles.SUPERADMIN && {
          commentedBySuperAdmin: { id: authUser.id },
        }),
        ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
          commentedByUser: authUser,
        }),
      }),
    );

    // console.log(authUser);
    await this.taskActivitiesService.create(
      `<b>${authUser.name}</b> has commented on a task.`,
      activityType.TASK_COMMENTED,
      task,
      authUser,
    );

    return this.getById(newComment.commentUniqueId);
  }

  /**
   * Get all comments
   * * Private comments visible to: Admin, Superadmin, and User(who commented privately)
   * @param authUser
   * @param taskUniqueId
   * @param paginationOptions
   * @returns
   */
  async findAll(
    authUser,
    taskUniqueId: string,
    paginationOptions: IPaginationOptions,
  ) {
    const task = await this.tasksService.findOneByUniqueId(taskUniqueId);
    if (!task) throw new BadRequestException('Task not found');

    const qb = this.taskCommentRepo
      .createQueryBuilder('c')
      .leftJoin('c.commentedByUser', 'u')
      .leftJoin('c.commentedByAdmin', 'a')
      .leftJoin('c.commentedBySuperAdmin', 'sa')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .addSelect([
        'a.id',
        'a.adminUniqueId',
        'a.email',
        'a.name',
        'a.profilePic',
      ])
      .addSelect(['sa.id', 'sa.email', 'sa.name'])
      .where('taskId =:taskId', { taskId: task.id })
      .andWhere('c.isPrivate =:iP', { iP: 0 });

    if (![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role)) {
      qb.orWhere(
        new Brackets((qb) => {
          qb.where('c.commentedByUserId = :commentedByUserId', {
            commentedByUserId: authUser.id,
          })
            .andWhere('c.isPrivate = :isPrivate', {
              isPrivate: 1,
            })
            .andWhere('c.commentedByUserId = :commentedByUserId', {
              commentedByUserId: authUser.id,
            })
            .andWhere('taskId =:taskId', { taskId: task.id });
        }),
      );
    } else {
      qb.orWhere(
        new Brackets((qb) => {
          qb.where('c.isPrivate = :isPrivate', {
            isPrivate: 1,
          }).andWhere('taskId =:taskId', { taskId: task.id });
        }),
      );
    }

    qb.orderBy('c.createdAt', 'DESC');

    const data = await paginate<TaskComment>(qb, paginationOptions);

    const items = data.items.map((c) => {
      return {
        commentUniqueId: c.commentUniqueId,
        comment: c.comment,
        isPrivate: !!c.isPrivate,
        createdAt: moment(c.createdAt).unix(),
        commentedBy: c.commentedByUser
          ? Roles.ROLE_BASED_USER
          : c.commentedByAdmin
          ? Roles.ADMIN
          : c.commentedBySuperAdmin
          ? Roles.SUPERADMIN
          : null,
        user: c.commentedByUser
          ? {
              id: Number(c.commentedByUser.id),
              userUniqueId: c.commentedByUser.userUniqueId,
              name: c.commentedByUser.name,
              email: c.commentedByUser.email,
              profilePic: c.commentedByUser.profilePic,
            }
          : c.commentedByAdmin
          ? {
              id: Number(c.commentedByAdmin.id),
              userUniqueId: c.commentedByAdmin.adminUniqueId,
              name: c.commentedByAdmin.name,
              email: c.commentedByAdmin.email,
              profilePic: c.commentedByAdmin.profilePic,
            }
          : c.commentedBySuperAdmin
          ? {
              id: Number(c.commentedBySuperAdmin.id),
              userUniqueId: null,
              name: c.commentedBySuperAdmin.name,
              email: c.commentedBySuperAdmin.email,
              profilePic: null,
            }
          : null,
      };
    });

    return { items: items.reverse(), meta: data.meta };
  }

  /**
   * FindOne by comment unique id
   * @param commentUniqueId
   * @returns
   */
  findOne(commentUniqueId: string) {
    return this.taskCommentRepo
      .createQueryBuilder('c')
      .leftJoin('c.commentedByUser', 'u')
      .leftJoin('c.commentedByAdmin', 'a')
      .leftJoin('c.commentedBySuperAdmin', 'sa')
      .leftJoin('c.task', 't')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .addSelect(['t.id'])
      .addSelect([
        'a.id',
        'a.adminUniqueId',
        'a.email',
        'a.name',
        'a.profilePic',
      ])
      .addSelect(['sa.id', 'sa.email', 'sa.name'])
      .where('commentUniqueId =:commentUniqueId', {
        commentUniqueId: commentUniqueId,
      })
      .getOne();
  }

  /**
   * FindOne by comment unique id
   * @param commentUniqueId
   * @returns
   */
  async getById(commentUniqueId: string) {
    const c = await this.taskCommentRepo
      .createQueryBuilder('c')
      .leftJoin('c.commentedByUser', 'u')
      .leftJoin('c.commentedByAdmin', 'a')
      .leftJoin('c.commentedBySuperAdmin', 'sa')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .addSelect([
        'a.id',
        'a.adminUniqueId',
        'a.email',
        'a.name',
        'a.profilePic',
      ])
      .addSelect(['sa.id', 'sa.email', 'sa.name'])
      .where('commentUniqueId =:commentUniqueId', {
        commentUniqueId: commentUniqueId,
      })
      .getOne();

    return {
      commentUniqueId: c.commentUniqueId,
      comment: c.comment,
      isPrivate: !!c.isPrivate,
      createdAt: moment(c.createdAt).unix(),
      commentedBy: c.commentedByUser
        ? Roles.ROLE_BASED_USER
        : c.commentedByAdmin
        ? Roles.ADMIN
        : c.commentedBySuperAdmin
        ? Roles.SUPERADMIN
        : null,
      user: c.commentedByUser
        ? {
            id: Number(c.commentedByUser.id),
            userUniqueId: c.commentedByUser.userUniqueId,
            name: c.commentedByUser.name,
            email: c.commentedByUser.email,
            profilePic: c.commentedByUser.profilePic,
          }
        : c.commentedByAdmin
        ? {
            id: Number(c.commentedByAdmin.id),
            userUniqueId: c.commentedByAdmin.adminUniqueId,
            name: c.commentedByAdmin.name,
            email: c.commentedByAdmin.email,
            profilePic: c.commentedByAdmin.profilePic,
          }
        : c.commentedBySuperAdmin
        ? {
            id: Number(c.commentedBySuperAdmin.id),
            userUniqueId: null,
            name: c.commentedBySuperAdmin.name,
            email: c.commentedBySuperAdmin.email,
            profilePic: null,
          }
        : null,
    };
  }

  /**
   *
   * @param commentUniqueId
   * @param updateTaskCommentDto
   * @returns
   */
  async update(
    authUser,
    commentUniqueId: string,
    updateTaskCommentDto: UpdateTaskCommentDto,
  ) {
    const comment = await this.findOne(commentUniqueId);
    if (!comment) throw new BadRequestException('Comment not found');

    if (
      ![
        comment.commentedByUser?.id,
        comment.commentedByAdmin?.id,
        comment.commentedBySuperAdmin?.id,
      ].includes(authUser.id)
    ) {
      throw new BadRequestException('You can not update others comment');
    }

    await this.taskCommentRepo.save(
      this.taskCommentRepo.create({
        ...updateTaskCommentDto,
        commentUniqueId,
        isPrivate: updateTaskCommentDto.isPrivate === true,
        id: comment.id,
      }),
    );

    // await this.taskActivitiesService.create(
    //   updateTaskCommentDto.comment === undefined
    //     ? `<b>${authUser.name}</b> has updated comment <b>"${
    //         comment.comment
    //       }"</b> from <b>${
    //         comment.isPrivate ? 'private' : 'public'
    //       }</b> comment to <b>${
    //         updateTaskCommentDto.isPrivate ? 'private' : 'public'
    //       }</b>.`
    //     : `<b>${authUser.name}</b> has updated comment from <b>${comment.comment}</b> to <b>${updateTaskCommentDto.comment}</b>.`,
    //   activityType.TASK_COMMENTED,
    //   comment.task,
    //   authUser,
    // );

    await this.taskActivitiesService.create(
      `<b>${authUser.name}</b> has updated comment.`,
      activityType.TASK_COMMENTED,
      comment.task,
      authUser,
    );

    return this.getById(commentUniqueId);
  }

  /**
   * Remove comment
   * @param authUser
   * @param commentUniqueId
   * @returns
   */
  async remove(authUser, commentUniqueId: string) {
    const comment = await this.findOne(commentUniqueId);
    if (!comment) throw new BadRequestException('Comment not found');

    if (
      ![
        comment.commentedByUser?.id,
        comment.commentedByAdmin?.id,
        comment.commentedBySuperAdmin?.id,
      ].includes(authUser.id)
    ) {
      throw new BadRequestException('You can not delete others comment');
    }

    await this.taskActivitiesService.create(
      `<b>${authUser.name}</b> has deleted a comment - <b>${comment.comment}</b>.`,
      activityType.TASK_COMMENT_DELETED,
      comment.task,
      authUser,
    );

    return this.taskCommentRepo.remove(comment);
  }
}
