import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { PostHogService } from '../posthog/posthog.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { EnquiriesService } from './enquiries.service';

@Controller('enquiries')
export class EnquiriesController {
  constructor(
    private readonly enquiriesService: EnquiriesService,
    private readonly postHogService: PostHogService,
  ) {}

  // Quote and diamond sourcing requests from the mobile app.
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(@Body() dto: CreateEnquiryDto) {
    const enquiry = await this.enquiriesService.send(dto);

    this.postHogService.client?.capture({
      event: 'enquiry_created',
    });

    return enquiry;
  }
}
