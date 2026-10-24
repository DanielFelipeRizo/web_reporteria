import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

/** Junta los mensajes de validación, incluidos los de objetos anidados */
function collectMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collectMessages(error.children ?? []),
  ]);
}

/**
 * Valida los cuerpos tipados con DTOs y descarta las propiedades que el DTO
 * no declara. Responde 400 con un único mensaje de texto, como el resto de
 * errores que muestra el frontend.
 *
 * Con stopAtFirstError se reporta un error por campo. class-validator evalúa
 * los decoradores de abajo hacia arriba, así que en los DTOs el chequeo más
 * básico (IsNotEmpty) va al final.
 */
export const appValidationPipe = new ValidationPipe({
  whitelist: true,
  stopAtFirstError: true,
  exceptionFactory: (errors) => new BadRequestException(collectMessages(errors).join('. ')),
});
