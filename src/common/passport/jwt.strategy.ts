import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessTokensService } from 'src/access-tokens/access-tokens.service';
import { UsersService } from 'src/api/users/users.service';
import { SuperAdminService } from 'src/api/super-admin/super-admin.service';
import { AdminService } from 'src/api/admin/admin.service';
import { Roles } from '../decorators/permissions.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
    private superAdminService: SuperAdminService,
    private adminService: AdminService,
    private accessTokensService: AccessTokensService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('APP_KEY'),
    });
  }

  /**
   * validate user
   * @param payload
   * @returns
   */
  async validate(payload: any) {
    // console.log(payload);
    const accessToken = await this.accessTokensService.findOne(payload.jti);

    let loggedUserData = null;
    if (payload.role === Roles.ADMIN) {
      loggedUserData = await this.adminService.findById(payload.sub);
    } else if (payload.role === Roles.SUPERADMIN) {
      loggedUserData = await this.superAdminService.findById(payload.sub);
    } else {
      loggedUserData = await this.usersService.findById(payload.sub);
    }

    const loggedUser = loggedUserData;

    // console.log(loggedUser);

    if (
      !loggedUser ||
      !accessToken ||
      accessToken.revoked > 0 ||
      Date.now() > accessToken.expiresAt.getTime() ||
      loggedUser.deletedAt
    ) {
      throw new UnauthorizedException();
    }

    return {
      ...loggedUser,
      jti: payload.jti,
      role: payload.role,
    };
  }
}
