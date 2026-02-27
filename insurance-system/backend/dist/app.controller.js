"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let AppController = class AppController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPolicies() {
        return this.prisma.policy.findMany({
            include: { customer: true },
            orderBy: { expiresAt: 'asc' }
        });
    }
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
    async getToImprove() {
        return this.prisma.policy.findMany({
            where: { status: "MEJORAR" },
            include: { customer: true },
            orderBy: { expiresAt: 'asc' }
        });
    }
    async renewPolicy(id) {
        const current = await this.prisma.policy.findUnique({ where: { id: Number(id) } });
        if (!current)
            return { error: "No encontrada" };
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
    async setImprove(id) {
        return this.prisma.policy.update({
            where: { id: Number(id) },
            data: { status: "MEJORAR" }
        });
    }
    async updatePolicy(id, data) {
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
    async deletePolicy(id) {
        return this.prisma.policy.delete({ where: { id: Number(id) } });
    }
    async createPolicy(data) {
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
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPolicies", null);
__decorate([
    (0, common_1.Get)('upcoming-expirations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Get)('to-improve'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getToImprove", null);
__decorate([
    (0, common_1.Patch)(':id/renew'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "renewPolicy", null);
__decorate([
    (0, common_1.Patch)(':id/set-improve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "setImprove", null);
__decorate([
    (0, common_1.Patch)(':id/update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updatePolicy", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deletePolicy", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createPolicy", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('policies'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map