import { IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty({
    message: 'confirm password should not be empty',
  })
  confirmPassword: string;
}
