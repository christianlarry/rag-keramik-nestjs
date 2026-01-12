import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import { AllConfigType } from './config/config.type';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // Create the NestJS application instancem, Enable CORS
  const app = await NestFactory.create(AppModule, { cors: true });

  // Retrieve configuration service
  const configService = app.get(ConfigService<AllConfigType>);

  // Enable shutdown hooks for graceful shutdown
  app.enableShutdownHooks();

  // Set global API prefix from configuration, excluding the root path
  const apiPrefix = configService.getOrThrow('app.apiPrefix', { infer: true });
  app.setGlobalPrefix(
    apiPrefix,
    {
      exclude: ['/'],
    },
  );

  // Enable URI versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Set up global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  /* 
    app.useGlobalInterceptors(
      // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
      // https://github.com/typestack/class-transformer/issues/549
      new ResolvePromisesInterceptor(),
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
   */

  // Use middlewares for logging, compression, and security headers
  const NODE_ENV = configService.getOrThrow('app.nodeEnv', { infer: true });

  if (NODE_ENV !== 'test') {
    app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  app.use(cookieParser());
  app.use(compression());
  app.use(helmet());

  // Set up Swagger documentation
  const documentOptions = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentOptions);
  SwaggerModule.setup('docs', app, document);

  // Start listening on the specified port or default to 3000
  const PORT = configService.getOrThrow('app.port', { infer: true }) || 3000;
  await app.listen(PORT);
}

bootstrap().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error('Error during application bootstrap:', err.message);
    console.error(err.stack);
  } else {
    console.error('Error during application bootstrap:', String(err));
  }
  process.exit(1);
});
