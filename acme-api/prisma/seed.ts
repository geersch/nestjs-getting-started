import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
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

  console.log('seeded');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
