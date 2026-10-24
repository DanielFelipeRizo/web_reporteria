import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsValidPassword } from '../../common/decorators/is-valid-password.decorator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual', example: 'miClave123' })
  @IsString({ message: 'currentPassword debe ser texto' })
  @IsNotEmpty({ message: 'currentPassword es obligatorio' })
  currentPassword: string;

  @ApiProperty({ description: 'Nueva contraseña', example: 'NuevaClave456!' })
  @IsValidPassword()
  newPassword: string;
}
