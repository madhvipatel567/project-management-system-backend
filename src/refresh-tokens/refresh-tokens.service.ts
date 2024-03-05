import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokens } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshTokens)
    private refreshTokenRepo: Repository<RefreshTokens>,
  ) {}

  /**
   * find by id
   * @param id
   * @returns
   */
  async findOne(id) {
    return this.refreshTokenRepo.findOne({
      where: {
        id: id,
      },
      relations: ['accessToken', 'accessToken.user'],
    });
  }

  /**
   * create refresh token
   * @param decodedToken
   * @returns
   */
  async createToken(decodedToken: any) {
    const refreshTokenLifeTime = moment
      .unix(decodedToken.exp)
      .add(2, 'd')
      .toDate();

    const refreshToken = uuidv4();

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        id: refreshToken,
        accessToken: decodedToken.jti,
        expiresAt: refreshTokenLifeTime,
      }),
    );

    return refreshToken;
  }

  /**
   * Revoke refresh token using JTI
   * @param jwtUniqueIdentifier
   */
  async revokeTokenUsingJti(jwtUniqueIdentifier: any) {
    const refreshToken = await this.refreshTokenRepo.findOne({
      where: { accessToken: { id: jwtUniqueIdentifier } },
    });

    refreshToken.revoked = 1;
    await this.refreshTokenRepo.save(refreshToken);
  }
}
