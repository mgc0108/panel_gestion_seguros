import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('policies')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // 1. OBTENER TODAS (Para el Archivo Histórico)
  @Get()
  async getPolicies() {
    return this.prisma.policy.findMany({
      include: { customer: true },
      orderBy: { expiresAt: 'asc' }
    });
  }

  // 2. VENCIMIENTOS PRÓXIMOS (Panel Principal - Solo ACTIVA y < 2 meses)
  @Get('upcoming-expirations')
  async getUpcoming() {
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

    return this.prisma.policy.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { gte: today, lte: twoMonthsFromNow }
      },
      include: { customer: true },
      orderBy: { expiresAt: 'asc' }
    });
  }

  // 3. CARTERA EN ESTUDIO (Estado MEJORAR)
  @Get('to-improve')
  async getToImprove() {
    return this.prisma.policy.findMany({
      where: { status: "MEJORAR" },
      include: { customer: true },
      orderBy: { expiresAt: 'asc' }
    });
  }

  // 4. RENOVAR (Suma 1 año y vuelve a ACTIVE)
  @Patch(':id/renew')
  async renewPolicy(@Param('id') id: string) {
    const current = await this.prisma.policy.findUnique({ where: { id: Number(id) } });
    if (!current) return { error: "No encontrada" };

    const newExpiration = new Date(current.expiresAt);
    newExpiration.setFullYear(newExpiration.getFullYear() + 1);

    return this.prisma.policy.update({
      where: { id: Number(id) },
      data: {
        issuedAt: new Date(),
        expiresAt: newExpiration,
        status: "ACTIVE"
      }
    });
  }

  // 5. MARCAR PARA MEJORAR OFERTA
  @Patch(':id/set-improve')
  async setImprove(@Param('id') id: string) {
    return this.prisma.policy.update({
      where: { id: Number(id) },
      data: { status: "MEJORAR" }
    });
  }

  // 6. ACTUALIZAR DATOS (Edición desde el Archivo)
  @Patch(':id/update')
  async updatePolicy(@Param('id') id: string, @Body() data: any) {
    return this.prisma.policy.update({
      where: { id: Number(id) },
      data: {
        category: data.category,
        premium: parseFloat(data.premium),
        expiresAt: new Date(data.expiresAt),
        customer: {
          update: {
            fullname: data.customer.fullname,
            dni: data.customer.dni,
            email: data.customer.email,
            phone: data.customer.phone,
            address: data.customer.address,
          }
        }
      }
    });
  }

  // 7. ELIMINAR (Dar de baja)
  @Delete(':id')
  async deletePolicy(@Param('id') id: string) {
    return this.prisma.policy.delete({ where: { id: Number(id) } });
  }

  // 8. CREAR NUEVA ALTA
  @Post()
  async createPolicy(@Body() data: any) {
    return this.prisma.policy.create({
      data: {
        policyNumber: data.policyNumber,
        category: data.type,
        premium: parseFloat(data.premium),
        issuedAt: new Date(data.issuedAt || new Date()),
        expiresAt: new Date(data.expiresAt),
        status: "ACTIVE",
        customer: {
          create: {
            fullname: data.clientName,
            dni: data.dni,
            email: data.email,
            phone: data.phone,
            address: data.address
          }
        }
      }
    });
  }
}