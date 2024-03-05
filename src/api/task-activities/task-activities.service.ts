import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/common/decorators/permissions.decorator';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { TasksService } from '../tasks/tasks.service';
import { TaskActivity } from './entities/task-activity.entity';

@Injectable()
export class TaskActivitiesService {
  constructor(
    @InjectRepository(TaskActivity)
    private readonly taskActivityRepo: Repository<TaskActivity>,

    @Inject(forwardRef(() => TasksService))
    private tasksService: TasksService,
  ) {}

  /**
   * Store activity
   * @param body
   * @param activityType
   * @param task
   * @param authUser
   */
  async create(body: string, activityType: number, task: Task, authUser) {
    await this.taskActivityRepo.save(
      this.taskActivityRepo.create({
        body,
        activityType,
        task: task.id,
        ...(authUser.role === Roles.ADMIN && {
          admin: { id: authUser.id },
        }),
        ...(authUser.role === Roles.SUPERADMIN && {
          superAdmin: { id: authUser.id },
        }),
        ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
          user: { id: authUser.id },
        }),
      }),
    );
  }

  async findAll(
    authUser,
    taskUniqueId: string,
    paginationOptions: IPaginationOptions,
  ) {
    const task = await this.tasksService.findOneByUniqueId(taskUniqueId);
    if (!task) throw new BadRequestException('Task not found');

    const qb = this.taskActivityRepo
      .createQueryBuilder('ta')
      .leftJoin('ta.user', 'u')
      .leftJoin('ta.admin', 'a')
      .leftJoin('ta.superAdmin', 'sa')
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
      .orderBy('ta.createdAt', 'DESC');

    const data = await paginate<TaskActivity>(qb, paginationOptions);

    const items = data.items.map((c) => {
      return {
        body: c.body,
        createdAt: moment(c.createdAt).unix(),
        activityBy: c.user
          ? Roles.ROLE_BASED_USER
          : c.admin
          ? Roles.ADMIN
          : c.superAdmin
          ? Roles.SUPERADMIN
          : null,
        user: c.user
          ? {
              id: Number(c.user.id),
              userUniqueId: c.user.userUniqueId,
              name: c.user.name,
              email: c.user.email,
              profilePic: c.user.profilePic,
            }
          : c.admin
          ? {
              id: Number(c.admin.id),
              userUniqueId: c.admin.adminUniqueId,
              name: c.admin.name,
              email: c.admin.email,
              profilePic: c.admin.profilePic,
            }
          : c.superAdmin
          ? {
              id: Number(c.superAdmin.id),
              userUniqueId: null,
              name: c.superAdmin.name,
              email: c.superAdmin.email,
              profilePic: null,
            }
          : null,
      };
    });

    return { items: items, meta: data.meta };
  }
}
