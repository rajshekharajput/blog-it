import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as firebaseAdmin from 'firebase-admin'
import * as serviceAccount from '../blog-app-ff2df-firebase-adminsdk-t2e0z-5e8254bf77.json'


export const admin = firebaseAdmin.initializeApp({
  // @ts-ignore
  credential: firebaseAdmin.credential.cert(serviceAccount)
})
export const storageRef = admin.storage().bucket('gs://blog_app')

async function bootstrap() {
  const PORT = process.env.PORT || 5000
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({credentials: true, origin: process.env.CLIENT_URL});

  await app.listen(PORT, () => console.log(`Server running om port: ${PORT}`));
}
bootstrap();
