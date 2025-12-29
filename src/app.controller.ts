import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getAppInfo() {
    return this.appService.appInfo();
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck(): string {
    return this.appService.checkHealth();
  }
}
