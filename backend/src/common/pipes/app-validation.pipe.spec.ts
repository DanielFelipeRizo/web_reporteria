import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { appValidationPipe } from './app-validation.pipe';
import { CreateUserDto, UpdateUserDto } from '../../users/dto/user.dto';
import { UpdatePermissionsDto } from '../../roles/dto/role.dto';
import { LoginDto } from '../../auth/dto/login.dto';

const body = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({ type: 'body', metatype, data: '' });

/** Devuelve el mensaje del 400 que lanza el pipe */
async function mensajeDeError(valor: unknown, metatype: ArgumentMetadata['metatype']) {
  try {
    await appValidationPipe.transform(valor, body(metatype));
  } catch (error) {
    if (error instanceof BadRequestException) return (error.getResponse() as { message: string }).message;
    throw error;
  }
  throw new Error('Se esperaba un 400');
}

describe('appValidationPipe', () => {
  it('responde 400 con un mensaje por campo faltante', async () => {
    await expect(mensajeDeError({}, LoginDto)).resolves.toBe('login es obligatorio. pswd es obligatorio');
  });

  it('acepta el usuario como lo envía el formulario (email vacío)', async () => {
    const dto = { login: 'jperez', pswd: 'Clave-Inicial1', name: 'Juan', email: '' };

    await expect(appValidationPipe.transform(dto, body(CreateUserDto))).resolves.toEqual(dto);
  });

  it('exige la política de contraseñas al crear usuarios', async () => {
    await expect(mensajeDeError({ login: 'jperez', pswd: '12345678' }, CreateUserDto))
      .resolves.toContain('La contraseña debe tener mínimo 8 caracteres');
  });

  it('descarta campos que el DTO no declara', async () => {
    const recibido = { name: 'Juan', pswd: 'texto-plano', priv_admin: 'Y' };

    await expect(appValidationPipe.transform(recibido, body(UpdateUserDto))).resolves.toEqual({ name: 'Juan' });
  });

  it('valida y limpia los permisos anidados', async () => {
    const permisos = { permissions: [{ app_name: 'ventas', group_id: 1, priv_access: 'Y' }] };

    await expect(appValidationPipe.transform(permisos, body(UpdatePermissionsDto)))
      .resolves.toEqual({ permissions: [{ app_name: 'ventas', priv_access: 'Y' }] });
    await expect(mensajeDeError({ permissions: [{ app_name: 'ventas', priv_access: 'SI' }] }, UpdatePermissionsDto))
      .resolves.toBe('priv_access debe ser Y o N');
  });
});
