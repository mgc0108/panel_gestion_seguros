import { PrismaService } from './prisma.service';
export declare class AppController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPolicies(): Promise<({
        customer: {
            id: number;
            fullname: string;
            dni: string;
            email: string | null;
            phone: string | null;
            address: string | null;
        };
    } & {
        id: number;
        policyNumber: string;
        category: string;
        premium: number;
        issuedAt: Date;
        expiresAt: Date;
        status: string;
        customerId: number;
    })[]>;
    getUpcoming(): Promise<({
        customer: {
            id: number;
            fullname: string;
            dni: string;
            email: string | null;
            phone: string | null;
            address: string | null;
        };
    } & {
        id: number;
        policyNumber: string;
        category: string;
        premium: number;
        issuedAt: Date;
        expiresAt: Date;
        status: string;
        customerId: number;
    })[]>;
    getToImprove(): Promise<({
        customer: {
            id: number;
            fullname: string;
            dni: string;
            email: string | null;
            phone: string | null;
            address: string | null;
        };
    } & {
        id: number;
        policyNumber: string;
        category: string;
        premium: number;
        issuedAt: Date;
        expiresAt: Date;
        status: string;
        customerId: number;
    })[]>;
    renewPolicy(id: string): Promise<{
        id: number;
        policyNumber: string;
        category: string;
        premium: number;
        issuedAt: Date;
        expiresAt: Date;
        status: string;
        customerId: number;
    } | {
        error: string;
    }>;
    setImprove(id: string): Promise<{
        id: number;
        policyNumber: string;
        category: string;
        premium: number;
        issuedAt: Date;
        expiresAt: Date;
        status: string;
        customerId: number;
    }>;
    updatePolicy(id: string, data: any): Promise<{
        id: number;
        policyNumber: string;
        category: string;
        premium: number;
        issuedAt: Date;
        expiresAt: Date;
        status: string;
        customerId: number;
    }>;
    deletePolicy(id: string): Promise<{
        id: number;
        policyNumber: string;
        category: string;
        premium: number;
        issuedAt: Date;
        expiresAt: Date;
        status: string;
        customerId: number;
    }>;
    createPolicy(data: any): Promise<{
        id: number;
        policyNumber: string;
        category: string;
        premium: number;
        issuedAt: Date;
        expiresAt: Date;
        status: string;
        customerId: number;
    }>;
}
