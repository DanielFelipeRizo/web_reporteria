import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { hashPassword } from '../common/utils/password';

const CLAVE = 'Clave-Correcta1';

describe('AuthService', () => {
  let service: AuthService;
  let bcryptHash: string;
  const usersService = {
    findByLogin: jest.fn(),
    upgradePasswordHash: jest.fn(),
    changePassword: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn().mockResolvedValue('token-firmado') };

  const usuario = (cambios: Record<string, unknown> = {}) => ({
    login: 'ana', name: 'Ana', email: 'ana@demo.test', usr_active: 'Y',
    isAdmin: false, permissions: {}, pswd: bcryptHash, ...cambios,
  });

  beforeAll(async () => {
    bcryptHash = await hashPassword(CLAVE);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signIn', () => {
    it('entrega el token con la contraseña correcta', async () => {
      usersService.findByLogin.mockResolvedValue(usuario());

      const result = await service.signIn('ana', CLAVE);

      expect(result.access_token).toBe('token-firmado');
      expect(result.user.login).toBe('ana');
      expect(usersService.upgradePasswordHash).not.toHaveBeenCalled();
    });

    it('rechaza una contraseña incorrecta', async () => {
      usersService.findByLogin.mockResolvedValue(usuario());

      await expect(service.signIn('ana', 'otra')).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
    });

    it('rechaza un usuario inexistente con el mismo mensaje', async () => {
      usersService.findByLogin.mockResolvedValue(null);

      await expect(service.signIn('nadie', CLAVE)).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
    });

    it('no revela que un usuario inactivo existe si la contraseña es incorrecta', async () => {
      usersService.findByLogin.mockResolvedValue(usuario({ usr_active: 'N' }));

      await expect(service.signIn('ana', 'otra')).rejects.toThrow('Credenciales inválidas');
    });

    it('avisa que el usuario está inactivo solo con la contraseña correcta', async () => {
      usersService.findByLogin.mockResolvedValue(usuario({ usr_active: 'N' }));

      await expect(service.signIn('ana', CLAVE)).rejects.toThrow('Usuario inactivo');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('reemplaza por bcrypt un hash SHA-256 heredado', async () => {
      const sha256 = createHash('sha256').update(CLAVE).digest('hex');
      usersService.findByLogin.mockResolvedValue(usuario({ pswd: sha256 }));

      await service.signIn('ana', CLAVE);

      expect(usersService.upgradePasswordHash).toHaveBeenCalledWith('ana', CLAVE);
    });
  });

  describe('changePassword', () => {
    it('rechaza el cambio si la contraseña actual es incorrecta', async () => {
      usersService.findByLogin.mockResolvedValue(usuario());

      await expect(service.changePassword('ana', 'otra', 'Nueva-Clave2')).rejects.toThrow(UnauthorizedException);
      expect(usersService.changePassword).not.toHaveBeenCalled();
    });

    it('cambia la contraseña si la actual es correcta', async () => {
      usersService.findByLogin.mockResolvedValue(usuario());

      await service.changePassword('ana', CLAVE, 'Nueva-Clave2');

      expect(usersService.changePassword).toHaveBeenCalledWith('ana', 'Nueva-Clave2');
    });
  });
});
