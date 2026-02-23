import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from {{PROJECT_NAME}} API!';
  }
}
