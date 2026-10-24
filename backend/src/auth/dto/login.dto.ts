import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Nombre de usuario (login)',
    example: 'admin',
  })
  @IsString({ message: 'login debe ser texto' })
  @IsNotEmpty({ message: 'login es obligatorio' })
  login: string;

  @ApiProperty({
    description: 'Contraseña en texto plano',
    example: '123456',
  })
  @IsString({ message: 'pswd debe ser texto' })
  @IsNotEmpty({ message: 'pswd es obligatorio' })
  pswd: string;
}
