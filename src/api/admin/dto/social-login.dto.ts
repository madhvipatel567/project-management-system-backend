import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SocialLoginDto {
  @ApiProperty({
    example: 'google',
  })
  @IsNotEmpty()
  providerType: string;

  @ApiProperty({
    example:
      'eyJraWQiOiJmaDZCczhDIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoiY29tLndhbGxudXRzLm1vYmlsZS5hcHAiLCJleHAiOjE2NjYwNzUzMDAsImlhdCI6MTY2NTk4ODkwMCwic3ViIjoiMDAwNDk2LmQxNWJiMGI1NWU2YjQ0YTM4NmY3ZTAxNjE5YTRjYTFhLjA2MzciLCJub25jZSI6IjFiNGNkY2E0ODcwNjVhNTliNzQ4YTg5ZmMwZDM1ZDk4ZWU2OThlYTlkYmYwODdmNmRmNDJhYTU4ZDA1ZTIxNzciLCJjX2hhc2giOiJqb2R2c2pFNkUyNnkwdUVUelpZWHhRIiwiZW1haWwiOiJwcml0ZXNoQHVuaXF1YWxpdGVjaC5jb20iLCJlbWFpbF92ZXJpZmllZCI6InRydWUiLCJhdXRoX3RpbWUiOjE2NjU5ODg5MDAsIm5vbmNlX3N1cHBvcnRlZCI6dHJ1ZSwicmVhbF91c2VyX3N0YXR1cyI6Mn0.GsVIIr-Qg6_5AR5lYr9_zgJs4jIu3gbLp8eZw_LmXCsXdlxSjzC8T215KHTlRZH_rh2VcgAuzeQ_sMA6nEGMdoeGLEVsEe16Zm0wE5BP7G7wRovsB-QKXGMoiPYmr_O7ibZB3_LAxalizxJdTXdYvGHpbv1rrJAMEUzGBWCsD7Y6dsYAh_FoH0yp6yMClnxdn72RYXgn4vXA_1XtuykYDHyGwidqhoPR8qFjUU9Mq8Reb8WG6b8wGmPehnOJlTS-l21cFLcf0CrQ9tbEAYZQvfsPrZ4psDedA18V_1Ani2NGBkuTMlS9mnDw1G_aqwGWWnKZmpMsZAMUNrRQXlLQpA',
  })
  @IsNotEmpty()
  token: string;
}
