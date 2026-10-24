import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Nombre de usuario (login)',
    example: 'admin',
  })
  login: string;

  @ApiProperty({
    description: 'Contraseña en texto plano',
    example: '123456',
  })
  pswd: string;
}
