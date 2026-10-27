import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  isMailConfigured,
  mailAccount,
  sendMail,
} from '../common/utils/mail.util';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

const SUBJECTS: Record<CreateEnquiryDto['type'], string> = {
  quote: 'Quote request',
  sourcing: 'Diamond sourcing request',
  contact: 'Trade enquiry',
};

const SOURCES: Record<NonNullable<CreateEnquiryDto['source']>, string> = {
  app: 'mobile app',
  website: 'website',
};

@Injectable()
export class EnquiriesService {
  async send(dto: CreateEnquiryDto) {
    // Sales inbox. Falls back to the SMTP account itself.
    const to = process.env.ENQUIRY_TO || mailAccount();

    if (!isMailConfigured() || !to) {
      console.error('Email service is not configured.');
      throw new InternalServerErrorException(
        'Email service is not configured.',
      );
    }

    const name = [dto.firstName, dto.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const source = SOURCES[dto.source || 'app'];

    const header = [
      `Name: ${name}`,
      `Email: ${dto.email}`,
      `Phone: ${dto.phone || 'Not provided'}`,
      `Company: ${dto.company || 'Not provided'}`,
      `Account ID: ${dto.accountId || 'Guest'}`,
      `Source: ${source}`,
      `Received: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await sendMail({
        to,
        replyTo: dto.email,
        subject: `${SUBJECTS[dto.type]} (${source}): ${name}`,
        text: `${header}\n\n${dto.message}`,
      });
    } catch (error) {
      console.error('Unable to send enquiry email:', error);
      throw new InternalServerErrorException(
        'Unable to send your request. Please try again later.',
      );
    }

    return { message: 'Request sent.' };
  }
}
