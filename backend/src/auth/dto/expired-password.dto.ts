import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsValidPassword } from '../../common/decorators/is-valid-password.decorator';

export class ExpiredPasswordDto {
  @ApiProperty({ description: 'Nombre de usuario (login)', example: 'jperez' })
  @IsString({ message: 'login debe ser texto' })
  @IsNotEmpty({ message: 'login es obligatorio' })
  login: string;

  @ApiProperty({ description: 'Contraseña vencida (la que asignó otro usuario)', example: 'ClaveTemporal1!' })
  @IsString({ message: 'pswd debe ser texto' })
  @IsNotEmpty({ message: 'pswd es obligatorio' })
  pswd: string;

  @ApiProperty({ description: 'Contraseña nueva', example: 'NuevaClave456!' })
  @IsValidPassword()
  newPassword: string;
}
