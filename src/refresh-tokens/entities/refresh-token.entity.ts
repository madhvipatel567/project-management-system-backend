import { AccessTokens } from 'src/access-tokens/entities/access-token.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class RefreshTokens {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => AccessTokens, (accessTokens) => accessTokens.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  accessToken!: AccessTokens;

  @Column({ type: 'boolean', default: false })
  revoked: number;

  @Column({ default: null })
  expiresAt: Date;
}
