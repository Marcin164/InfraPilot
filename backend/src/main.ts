import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { randomUUID } from 'crypto';

function buildCorsOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return false; // no cross-origin allowed by default
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['log', 'warn', 'error']
        : ['log', 'warn', 'error', 'debug'],
  });

  // Only trust X-Forwarded-* when we know a reverse proxy sits in front of
  // us — otherwise any client could spoof its own IP and defeat per-IP rate
  // limiting. Opt-in via env since we can't infer the deployment topology.
  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  // Request ID middleware — propagate X-Request-Id from caller or generate
  // one. Lets us correlate logs/audit across services.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const id =
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    (req as any).requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  // Security headers — sane defaults from helmet. This app is a JSON API
  // (the SPA ships its own CSP via a <meta> tag in its built index.html),
  // so a locked-down default-src covers any error page or future HTML
  // response without needing to know the frontend's own asset origins.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const corsOrigins = buildCorsOrigins();
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'X-Request-Id',
      'X-Device-Id',
      'X-Timestamp',
      'X-Nonce',
      'X-Signature',
      'X-Enrollment-Token',
      'X-Idempotency-Key',
    ],
    exposedHeaders: ['X-Request-Id', 'X-Report-Sha256'],
  });

  app.use(
    json({
      limit: '50mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  logger.log(
    `InfraPilot API listening on :${port} (env=${process.env.NODE_ENV ?? 'unset'})`,
  );
  if (corsOrigins === false) {
    logger.warn(
      'CORS_ORIGINS not set — cross-origin requests will be rejected. Set it in .env to allow your frontend.',
    );
  } else {
    logger.log(`CORS allowed origins: ${(corsOrigins as string[]).join(', ')}`);
  }
  if (process.env.MFA_REQUIRED !== 'true') {
    logger.warn(
      'MFA_REQUIRED is not set to \'true\' — MFA is NOT enforced on sensitive modules ' +
        '(audit export, privacy erase/export, legal hold, retention run, AD sync, SMTP, ' +
        'M365, compliance, CVE, fleet). Set it in .env for production.',
    );
  }
}
bootstrap();
