import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PilotService } from './pilot.service.js';

@ApiTags('Pilot')
@ApiBearerAuth('JWT-auth')
@Controller('pilot')
export class PilotController {
  constructor(private readonly pilotService: PilotService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current pilot profile' })
  @ApiResponse({
    status: 200,
    description: 'Pilot profile data',
    schema: {
      example: {
        name: 'John Doe',
        totalFlightHours: 1444.5,
        avatarUrl:
          'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=256&q=80',
      },
    },
  })
  getMe() {
    return this.pilotService.getProfile();
  }
}
