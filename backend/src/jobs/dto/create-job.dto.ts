import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({
    description: 'List of HTTP or HTTPS URLs to check',
    example: ['https://example.com', 'https://github.com'],
  })
  urls!: string[];
}
