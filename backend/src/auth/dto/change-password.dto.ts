import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual', example: 'miClave123' })
  currentPassword: string;

  @ApiProperty({ description: 'Nueva contraseña', example: 'nuevaClave456' })
  newPassword: string;
}
