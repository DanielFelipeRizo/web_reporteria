import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf,
} from 'class-validator';
import { IsValidPassword } from '../../common/decorators/is-valid-password.decorator';

const YES_NO = ['Y', 'N'];

export class CreateUserDto {
  @ApiProperty({ description: 'Login único del usuario', example: 'jperez' })
  @MaxLength(150, { message: 'login admite máximo 150 caracteres' })
  @IsString({ message: 'login debe ser texto' })
  @IsNotEmpty({ message: 'login es obligatorio' })
  login: string;

  @ApiProperty({ description: 'Contraseña inicial (se guarda con bcrypt)', example: 'ClaveInicial1!' })
  @IsValidPassword()
  pswd: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString({ message: 'name debe ser texto' })
  name?: string;

  // El formulario envía '' cuando no se llena el correo
  @ApiPropertyOptional({ example: 'jperez@empresa.com' })
  @ValidateIf((dto: CreateUserDto) => !!dto.email)
  @IsEmail({}, { message: 'email no es un correo válido' })
  email?: string;

  @ApiPropertyOptional({ enum: YES_NO })
  @IsOptional()
  @IsIn(YES_NO, { message: 'priv_admin debe ser Y o N' })
  priv_admin?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString({ message: 'name debe ser texto' })
  name?: string;

  @ApiPropertyOptional({ example: 'jperez@empresa.com' })
  @ValidateIf((dto: UpdateUserDto) => !!dto.email)
  @IsEmail({}, { message: 'email no es un correo válido' })
  email?: string;

  @ApiPropertyOptional({ enum: YES_NO, description: 'Y = activo, N = inactivo' })
  @IsOptional()
  @IsIn(YES_NO, { message: 'usr_active debe ser Y o N' })
  usr_active?: string;
}

export class SetPasswordDto {
  @ApiProperty({ description: 'Nueva contraseña', example: 'NuevaClave456!' })
  @IsValidPassword()
  newPassword: string;
}

export class AssignRolesDto {
  @ApiProperty({ type: [Number], example: [1] })
  @IsArray({ message: 'groupIds debe ser una lista' })
  @IsInt({ each: true, message: 'groupIds debe contener números enteros' })
  groupIds: number[];
}
