import { applyDecorators } from '@nestjs/common';
import { IsStrongPassword } from 'class-validator';

/** Política para contraseñas nuevas, la misma que valida el frontend en Usuarios */
export const IsValidPassword = () =>
  applyDecorators(
    IsStrongPassword(
      { minLength: 8, minLowercase: 0, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
      { message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial' },
    ),
  );
