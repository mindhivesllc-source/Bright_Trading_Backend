import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';

import { env } from '../config/env.config';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';

// A revoked token presented this soon after its rotation is treated as a
// concurrent duplicate request rather than as token theft.
export const REFRESH_GRACE_MS = 30 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_PLATFORMS = ['ios', 'android', 'web'];

export interface RefreshClientInfo {
  userAgent?: string;
  platform?: string;
}

export interface IssuedRefreshToken {
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export type RotationResult =
  | { status: 'rotated'; userId: string; issued: IssuedRefreshToken }
  | { status: 'invalid' }
  | { status: 'in_progress' }
  | { status: 'reused'; userId: string };

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  // Single clock for every timestamp this service writes or compares.
  now(): Date {
    return new Date();
  }

  async issue(
    userId: string,
    client: RefreshClientInfo = {},
    familyId: string = randomUUID(),
  ): Promise<IssuedRefreshToken> {
    const { token, doc } = await this.createToken(userId, familyId, client);

    return {
      refreshToken: token,
      refreshTokenExpiresAt: doc.expiresAt.toISOString(),
    };
  }

  // Revokes the presented token and issues its successor in the same family.
  async rotate(
    rawToken: string,
    client: RefreshClientInfo = {},
  ): Promise<RotationResult> {
    const now = this.now();
    const current = await this.findValidOrRevoked(rawToken, now);

    if (!current) {
      return { status: 'invalid' };
    }

    const userId = current.userId.toString();

    if (current.revokedAt) {
      // Revoked by logout or password reset rather than by rotation.
      if (!current.replacedByHash) {
        return { status: 'invalid' };
      }

      if (await this.isConcurrentDuplicate(current, now)) {
        return { status: 'in_progress' };
      }

      // A rotated token came back after the grace window: treat the
      // session as stolen and end it everywhere.
      await this.revokeFamily(current.familyId);
      return { status: 'reused', userId };
    }

    // The successor is written before the presented token is claimed, so
    // a parallel request never sees a replacedByHash without its document.
    const next = await this.createToken(userId, current.familyId, client);

    const claimed = await this.refreshTokenModel
      .updateOne(
        { _id: current._id, revokedAt: null },
        { $set: { revokedAt: now, replacedByHash: next.doc.tokenHash } },
      )
      .exec();

    if (claimed.modifiedCount === 0) {
      // Another request rotated this token first.
      await this.refreshTokenModel.deleteOne({ _id: next.doc._id }).exec();
      return { status: 'in_progress' };
    }

    return {
      status: 'rotated',
      userId,
      issued: {
        refreshToken: next.token,
        refreshTokenExpiresAt: next.doc.expiresAt.toISOString(),
      },
    };
  }

  // Revokes the whole family of the presented token. Unknown tokens are ignored.
  async revokeFamilyOf(rawToken: string): Promise<void> {
    const doc = await this.refreshTokenModel
      .findOne({ tokenHash: this.hash(rawToken) })
      .exec();

    if (doc) {
      await this.revokeFamily(doc.familyId);
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }

    await this.refreshTokenModel
      .updateMany(
        { userId: new Types.ObjectId(userId), revokedAt: null },
        { $set: { revokedAt: this.now() } },
      )
      .exec();
  }

  async deleteAllForUser(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }

    await this.refreshTokenModel
      .deleteMany({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  hash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private async findValidOrRevoked(
    rawToken: string,
    now: Date,
  ): Promise<RefreshTokenDocument | null> {
    if (typeof rawToken !== 'string' || !rawToken) {
      return null;
    }

    const doc = await this.refreshTokenModel
      .findOne({ tokenHash: this.hash(rawToken) })
      .exec();

    if (!doc || doc.expiresAt.getTime() <= now.getTime()) {
      return null;
    }

    return doc;
  }

  private async isConcurrentDuplicate(
    doc: RefreshTokenDocument,
    now: Date,
  ): Promise<boolean> {
    if (
      !doc.revokedAt ||
      !doc.replacedByHash ||
      now.getTime() - doc.revokedAt.getTime() > REFRESH_GRACE_MS
    ) {
      return false;
    }

    const successor = await this.refreshTokenModel
      .findOne({ tokenHash: doc.replacedByHash })
      .exec();

    return (
      successor !== null &&
      !successor.revokedAt &&
      successor.expiresAt.getTime() > now.getTime()
    );
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany(
        { familyId, revokedAt: null },
        { $set: { revokedAt: this.now() } },
      )
      .exec();
  }

  private async createToken(
    userId: string,
    familyId: string,
    client: RefreshClientInfo,
  ): Promise<{ token: string; doc: RefreshTokenDocument }> {
    const token = randomBytes(32).toString('base64url');
    const platform = client.platform?.toLowerCase();

    const doc = await this.refreshTokenModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash: this.hash(token),
      familyId,
      expiresAt: new Date(
        this.now().getTime() + env.refreshTokenTtlDays * DAY_MS,
      ),
      userAgent: client.userAgent?.slice(0, 200) || undefined,
      platform:
        platform && ALLOWED_PLATFORMS.includes(platform) ? platform : undefined,
    });

    return { token, doc };
  }
}
