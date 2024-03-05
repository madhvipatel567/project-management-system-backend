import { UnauthorizedException } from '@nestjs/common';
import { Buffer } from 'buffer';

const {
  MICROSOFT_APPLICATION_CLIENT_ID,
  MICROSOFT_TENANT_ID,
  MICROSOFT_AUDIENCE,
} = process.env;

export default class SocialiteMicrosoft {
  async generateUserFromToken(token: string) {
    try {
      let decodedToken = null;
      try {
        decodedToken = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString(),
        );
      } catch (e) {
        // console.log(e);
      }

      return {
        providerId: decodedToken.puid,
        email: decodedToken.unique_name ? decodedToken.unique_name : null,
        name: decodedToken.name,
        profilePic: null,
      };
    } catch (err) {
      // console.log(err);
      throw new UnauthorizedException(
        'Error while authenticating microsoft user',
      );
    }
  }
}
