import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import * as moment from 'moment';
import { Admin } from 'src/api/admin/entities/admin.entity';
import { SuperAdmin } from 'src/api/super-admin/entities/super-admin.entity';
import { Users } from 'src/api/users/entities/user.entity';
import { RefreshTokensService } from 'src/refresh-tokens/refresh-tokens.service';
import { Repository } from 'typeorm';
import { AccessTokens } from './entities/access-token.entity';

@Injectable()
export class AccessTokensService {
  constructor(
    @InjectRepository(AccessTokens)
    private accessTokenRepo: Repository<AccessTokens>,
    private jwtService: JwtService,

    private refreshTokensService: RefreshTokensService,
  ) {}

  /**
   * Find one
   * @param id
   */
  async findOne(id: any) {
    return await this.accessTokenRepo.findOne({ where: { id: id } });
  }

  /**
   * create JWT token Super Admin/ Admin or User
   * @param user
   * @returns
   */
  async createAccessToken(user: Admin | SuperAdmin | Users, userRole?: string) {
    const role =
      user instanceof SuperAdmin
        ? 'SuperAdmin'
        : user instanceof Users
        ? userRole.trim()
        : user instanceof Admin
        ? 'Admin'
        : null;

    const jwtToken = this.jwtService.sign({
      username: user.email,
      role,
      sub: user.id,
      jti: randomBytes(32).toString('hex'),
    });

    const decodedToken = this.jwtService.decode(jwtToken);

    const createdAt = moment.unix(decodedToken['iat']).toDate();
    const expiresAt = moment.unix(decodedToken['exp']).toDate();

    const accessToken = this.accessTokenRepo.create({
      id: decodedToken['jti'],
      expiresAt,
      createdAt,
      superAdmin: user instanceof SuperAdmin ? user : null,
      user: user instanceof Users ? user : null,
      admin: user instanceof Admin ? user : null,
    });

    await this.accessTokenRepo.save(accessToken);
    return { accessToken, jwtToken, decodedToken };
  }

  /**
   * generate login admin token
   * @param admin
   * @returns
   */
  async generateTokens(user?: Admin | SuperAdmin | Users, userRole?: string) {
    const { decodedToken, jwtToken } = await this.createAccessToken(
      user,
      userRole,
    );

    const refreshToken = await this.refreshTokensService.createToken(
      decodedToken,
    );

    return {
      accessToken: jwtToken,
      refreshToken,
      expiresAt: decodedToken['exp'],
    };
  }

  /**
   * Revoke access token using Jwt Unique Identifier
   * @param jwtUniqueIdentifier
   */
  async revokeToken(jwtUniqueIdentifier: string) {
    await this.accessTokenRepo.save({
      id: jwtUniqueIdentifier,
      revoked: 1,
    });
  }
}
