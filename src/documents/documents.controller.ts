import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service.js';

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get pilot documents with calculated expiry days and urgency status' })
  @ApiResponse({
    status: 200,
    description: 'List of pilot documents with expiry status',
    schema: {
      example: {
        today: '2026-05-15',
        warningDays: 30,
        items: [
          {
            id: 'doc_security',
            label: 'Security Clearance Exp. Date',
            expiryDate: '2026-05-01',
            daysRemaining: -14,
            status: 'expired',
          },
          {
            id: 'doc_license',
            label: 'Indonesian License Exp. Date',
            expiryDate: '2026-05-29',
            daysRemaining: 14,
            status: 'soon',
          },
          {
            id: 'doc_medical',
            label: 'Indonesian Medical Exp. Date',
            expiryDate: '2026-06-11',
            daysRemaining: 27,
            status: 'soon',
          },
          {
            id: 'doc_recurrent',
            label: 'Next Recurrent Date',
            expiryDate: '2026-10-14',
            daysRemaining: 152,
            status: 'safe',
          },
          {
            id: 'doc_ppc',
            label: 'PPC Exp. Date',
            expiryDate: '2026-12-25',
            daysRemaining: 224,
            status: 'safe',
          },
        ],
      },
    },
  })
  getAll() {
    return this.documentsService.getAll();
  }
}
