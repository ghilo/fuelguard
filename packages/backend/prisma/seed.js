"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Create Super Admin
    const adminPassword = await bcryptjs_1.default.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@fuelguard.dz' },
        update: {},
        create: {
            email: 'admin@fuelguard.dz',
            password: adminPassword,
            fullName: 'Super Admin',
            phone: '+213555000000',
            role: client_1.UserRole.SUPER_ADMIN,
        },
    });
    console.log('Created admin:', admin.email);
    // Create test stations
    const stations = await Promise.all([
        prisma.station.upsert({
            where: { code: 'ALG-001' },
            update: {},
            create: {
                name: 'Station Naftal Alger Centre',
                code: 'ALG-001',
                address: '123 Rue Didouche Mourad',
                wilaya: 'Alger',
                commune: 'Alger Centre',
                latitude: 36.7538,
                longitude: 3.0588,
            },
        }),
        prisma.station.upsert({
            where: { code: 'ALG-002' },
            update: {},
            create: {
                name: 'Station Naftal Bab Ezzouar',
                code: 'ALG-002',
                address: '45 Boulevard de l\'ALN',
                wilaya: 'Alger',
                commune: 'Bab Ezzouar',
                latitude: 36.7175,
                longitude: 3.1828,
            },
        }),
        prisma.station.upsert({
            where: { code: 'ORA-001' },
            update: {},
            create: {
                name: 'Station Naftal Oran',
                code: 'ORA-001',
                address: '78 Boulevard Front de Mer',
                wilaya: 'Oran',
                commune: 'Oran',
                latitude: 35.6969,
                longitude: -0.6331,
            },
        }),
    ]);
    console.log('Created stations:', stations.length);
    // Create Station Manager
    const managerPassword = await bcryptjs_1.default.hash('manager123', 12);
    const manager = await prisma.user.upsert({
        where: { email: 'manager@fuelguard.dz' },
        update: {},
        create: {
            email: 'manager@fuelguard.dz',
            password: managerPassword,
            fullName: 'Ahmed Benali',
            phone: '+213555111111',
            role: client_1.UserRole.STATION_MANAGER,
        },
    });
    // Assign manager to first station
    await prisma.stationManager.upsert({
        where: { userId_stationId: { userId: manager.id, stationId: stations[0].id } },
        update: {},
        create: {
            userId: manager.id,
            stationId: stations[0].id,
        },
    });
    console.log('Created station manager:', manager.email);
    // Create test Citizen
    const citizenPassword = await bcryptjs_1.default.hash('citizen123', 12);
    const citizen = await prisma.user.upsert({
        where: { email: 'citizen@test.dz' },
        update: {},
        create: {
            email: 'citizen@test.dz',
            password: citizenPassword,
            nationalId: '123456789012345678',
            fullName: 'Mohamed Kader',
            phone: '+213555222222',
            role: client_1.UserRole.CITIZEN,
        },
    });
    console.log('Created citizen:', citizen.email);
    // Create test vehicle for citizen
    const vehicle = await prisma.vehicle.upsert({
        where: { plateNumber: '00123-123-16' },
        update: {},
        create: {
            ownerId: citizen.id,
            plateNumber: '00123-123-16',
            vehicleType: client_1.VehicleType.PRIVATE_CAR,
            fuelType: client_1.FuelType.ESSENCE,
            brand: 'Renault',
            model: 'Symbol',
            isVerified: true,
        },
    });
    console.log('Created vehicle:', vehicle.plateNumber);
    // Create Fuel Rules (default rules as specified)
    const fuelRules = await Promise.all([
        prisma.fuelRule.upsert({
            where: {
                vehicleType_wilaya: {
                    vehicleType: client_1.VehicleType.PRIVATE_CAR,
                    wilaya: 'ALL',
                },
            },
            update: {},
            create: {
                vehicleType: client_1.VehicleType.PRIVATE_CAR,
                wilaya: 'ALL',
                maxFillsPerPeriod: 1,
                periodHours: 72,
                maxLitersPerFill: 50,
            },
        }),
        prisma.fuelRule.upsert({
            where: {
                vehicleType_wilaya: {
                    vehicleType: client_1.VehicleType.TAXI,
                    wilaya: 'ALL',
                },
            },
            update: {},
            create: {
                vehicleType: client_1.VehicleType.TAXI,
                wilaya: 'ALL',
                maxFillsPerPeriod: 2,
                periodHours: 24,
                maxLitersPerFill: 40,
            },
        }),
        prisma.fuelRule.upsert({
            where: {
                vehicleType_wilaya: {
                    vehicleType: client_1.VehicleType.TRUCK,
                    wilaya: 'ALL',
                },
            },
            update: {},
            create: {
                vehicleType: client_1.VehicleType.TRUCK,
                wilaya: 'ALL',
                maxFillsPerPeriod: 1,
                periodHours: 48,
                maxLitersPerFill: 200,
            },
        }),
        prisma.fuelRule.upsert({
            where: {
                vehicleType_wilaya: {
                    vehicleType: client_1.VehicleType.MOTORCYCLE,
                    wilaya: 'ALL',
                },
            },
            update: {},
            create: {
                vehicleType: client_1.VehicleType.MOTORCYCLE,
                wilaya: 'ALL',
                maxFillsPerPeriod: 1,
                periodHours: 72,
                maxLitersPerFill: 15,
            },
        }),
        prisma.fuelRule.upsert({
            where: {
                vehicleType_wilaya: {
                    vehicleType: client_1.VehicleType.BUS,
                    wilaya: 'ALL',
                },
            },
            update: {},
            create: {
                vehicleType: client_1.VehicleType.BUS,
                wilaya: 'ALL',
                maxFillsPerPeriod: 1,
                periodHours: 24,
                maxLitersPerFill: 150,
            },
        }),
        prisma.fuelRule.upsert({
            where: {
                vehicleType_wilaya: {
                    vehicleType: client_1.VehicleType.GOVERNMENT,
                    wilaya: 'ALL',
                },
            },
            update: {},
            create: {
                vehicleType: client_1.VehicleType.GOVERNMENT,
                wilaya: 'ALL',
                maxFillsPerPeriod: 999,
                periodHours: 24,
                maxLitersPerFill: 999,
            },
        }),
        prisma.fuelRule.upsert({
            where: {
                vehicleType_wilaya: {
                    vehicleType: client_1.VehicleType.OTHER,
                    wilaya: 'ALL',
                },
            },
            update: {},
            create: {
                vehicleType: client_1.VehicleType.OTHER,
                wilaya: 'ALL',
                maxFillsPerPeriod: 1,
                periodHours: 72,
                maxLitersPerFill: 50,
            },
        }),
    ]);
    console.log('Created fuel rules:', fuelRules.length);
    // Create Gas Bottle Rules
    const gasRules = await Promise.all([
        prisma.gasBottleRule.create({
            data: {
                name: 'Small Household (1-2 members)',
                maxBottlesPerPeriod: 1,
                periodDays: 30,
                minMemberCount: 1,
                maxMemberCount: 2,
                bottleSize: 13,
            },
        }).catch(() => null), // Ignore if exists
        prisma.gasBottleRule.create({
            data: {
                name: 'Medium Household (3-5 members)',
                maxBottlesPerPeriod: 2,
                periodDays: 30,
                minMemberCount: 3,
                maxMemberCount: 5,
                bottleSize: 13,
            },
        }).catch(() => null),
        prisma.gasBottleRule.create({
            data: {
                name: 'Large Household (6+ members)',
                maxBottlesPerPeriod: 3,
                periodDays: 30,
                minMemberCount: 6,
                maxMemberCount: null,
                bottleSize: 13,
            },
        }).catch(() => null),
    ]);
    console.log('Created gas bottle rules');
    console.log('Seeding completed!');
    console.log('\nTest accounts:');
    console.log('  Admin: admin@fuelguard.dz / admin123');
    console.log('  Manager: manager@fuelguard.dz / manager123');
    console.log('  Citizen: citizen@test.dz / citizen123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map