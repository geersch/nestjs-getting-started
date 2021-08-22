import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  /**
   * Car brands
   */
  await prisma.carBrand.upsert({
    where: { id: 1 },
    update: {
      name: 'Audi',
    },
    create: {
      name: 'Audi',
      minimumDriverAge: 18,
      yearlyPremium: 250,
    },
  });

  await prisma.carBrand.upsert({
    where: { id: 2 },
    update: {
      name: 'BMW',
    },
    create: {
      name: 'BMW',
      minimumDriverAge: 18,
      yearlyPremium: 150,
    },
  });

  await prisma.carBrand.upsert({
    where: { id: 3 },
    update: {
      name: 'Porsche',
    },
    create: {
      name: 'Porsche',
      minimumDriverAge: 25,
      yearlyPremium: 500,
    },
  });

  /**
   * Users
   */
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      username: 'Bob',
      hashedPassword: '$2a$08$hZCfpa2XVRshMkKwPGqnHOFjp9ldeTZWpt5Ph9.MH6Bhquw6i5byi'
    }
  });

  await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      username: 'Alice',
      hashedPassword: '$2a$08$2cF6keVw/M0QAy3f9GWIdO1d9ubns0B19EIKlXSmI62gt474SbNMK'
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
