import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested,
} from 'class-validator';

const YES_NO = ['Y', 'N'];

export class SaveRoleDto {
  @ApiProperty({ description: 'Nombre del rol', example: 'Consulta' })
  @MaxLength(255, { message: 'description admite máximo 255 caracteres' })
  @IsString({ message: 'description debe ser texto' })
  @IsNotEmpty({ message: 'description es obligatorio' })
  description: string;
}

export class PermissionDto {
  @ApiProperty({ example: 'ventas' })
  @MaxLength(150, { message: 'app_name admite máximo 150 caracteres' })
  @IsString({ message: 'app_name debe ser texto' })
  @IsNotEmpty({ message: 'app_name es obligatorio' })
  app_name: string;

  @ApiPropertyOptional({ enum: YES_NO }) @IsOptional() @IsIn(YES_NO, { message: 'priv_access debe ser Y o N' }) priv_access?: string;
  @ApiPropertyOptional({ enum: YES_NO }) @IsOptional() @IsIn(YES_NO, { message: 'priv_insert debe ser Y o N' }) priv_insert?: string;
  @ApiPropertyOptional({ enum: YES_NO }) @IsOptional() @IsIn(YES_NO, { message: 'priv_delete debe ser Y o N' }) priv_delete?: string;
  @ApiPropertyOptional({ enum: YES_NO }) @IsOptional() @IsIn(YES_NO, { message: 'priv_update debe ser Y o N' }) priv_update?: string;
  @ApiPropertyOptional({ enum: YES_NO }) @IsOptional() @IsIn(YES_NO, { message: 'priv_export debe ser Y o N' }) priv_export?: string;
  @ApiPropertyOptional({ enum: YES_NO }) @IsOptional() @IsIn(YES_NO, { message: 'priv_print debe ser Y o N' }) priv_print?: string;
}

export class UpdatePermissionsDto {
  @ApiProperty({ type: [PermissionDto] })
  @IsArray({ message: 'permissions debe ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}
