import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Crea la instancia de la aplicación usando el módulo raíz
  const app = await NestFactory.create(AppModule);

  // IMPORTANTE: Habilita CORS para que el Frontend (puerto 5173) 
  // pueda hacer peticiones a este Backend (puerto 3000)
  app.enableCors();

  // Arranca el servidor en el puerto 3000
  await app.listen(3000);
  console.log('🚀 Servidor funcionando en: http://localhost:3000');
}
bootstrap();