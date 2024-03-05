import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { generateUniqueId } from 'src/common/helper/common.helper';
import { Repository } from 'typeorm';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
  ) {}

  /**
   * Create new tags
   * @param tags
   * @param workspace
   * @returns
   */
  async create(tags: Array<string>, workspace: Workspace) {
    const existingTags = await this.findAllByWorkspaces(workspace);
    // console.log('existingTags', existingTags);
    const existingTagsValues = existingTags.map((t) => t.tag.trim());
    // console.log('existingTagsValues', existingTagsValues);

    const newTags = tags.filter(
      (tag) => !existingTagsValues.includes(tag.trim()) && tag.trim(),
    );
    // console.log('newTags', newTags);

    const entities = await Promise.all(
      newTags.map(async (newTag) => {
        const tagUniqueId = await generateUniqueId('TAG');
        return this.tagRepo.create({
          tag: newTag.trim(),
          tagUniqueId,
          workspace: { id: workspace.id },
        });
      }),
    );

    const allExistingTags = await this.findTagsIn(tags, workspace);
    // console.log('allExistingTags', allExistingTags);

    const createdTags = await this.tagRepo.save(entities);

    // console.log('createdTags::', createdTags);
    // console.log(allExistingTags.concat(createdTags));

    return allExistingTags.concat(createdTags);
  }

  /**
   * Find tags in exisitng tags
   * @param tags
   */
  async findTagsIn(tags: Array<string>, workspace: Workspace) {
    if (tags) {
      // console.log(tags);
      return this.tagRepo
        .createQueryBuilder('t')
        .where('tag IN (:tags)', { tags })
        .andWhere('workspaceId = :workspaceId', { workspaceId: workspace.id })
        .getMany();
    }
    return [];
  }

  /**
   * Find all tags by workspace
   * @param workspace
   * @returns
   */
  async findAllByWorkspaces(workspace: Workspace) {
    const tags = await this.tagRepo
      .createQueryBuilder('t')
      .where('workspaceId = :workspaceId', { workspaceId: workspace.id })
      .getMany();

    return tags;
  }
}
