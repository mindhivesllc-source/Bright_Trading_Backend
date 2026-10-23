import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { CreateEnquiryDto } from './dto/create-enquiry.dto';

const SUBJECTS: Record<CreateEnquiryDto['type'], string> = {
  quote: 'Quote request (mobile app)',
  sourcing: 'Diamond sourcing request (mobile app)',
};

@Injectable()
export class EnquiriesService {
  async send(dto: CreateEnquiryDto) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPassword) {
      console.error('SMTP credentials are not configured.');
      throw new InternalServerErrorException(
        'Email service is not configured.',
      );
    }

    // Sales inbox. Falls back to the SMTP account itself.
    const to = process.env.ENQUIRY_TO || smtpUser;
    const port = Number(process.env.SMTP_PORT || 465);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure:
        process.env.SMTP_SECURE !== undefined
          ? process.env.SMTP_SECURE === 'true'
          : port === 465,
      auth: { user: smtpUser, pass: smtpPassword },
    });

    const name = [dto.firstName, dto.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const header = [
      `Name: ${name}`,
      `Email: ${dto.email}`,
      `Phone: ${dto.phone || 'Not provided'}`,
      `Company: ${dto.company || 'Not provided'}`,
      `Account ID: ${dto.accountId || 'Guest'}`,
      `Received: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || smtpUser,
        to,
        replyTo: dto.email,
        subject: `${SUBJECTS[dto.type]}: ${name}`,
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
