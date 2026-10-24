import { Module } from '@nestjs/common';
import { CierresService } from './cierres.service';
import { CierresController } from './cierres.controller';

@Module({
  providers: [CierresService],
  controllers: [CierresController]
})
export class CierresModule {}
