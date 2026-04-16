import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaLibSql({ url: 'file:dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // Create primary user cedric
  const user = await prisma.user.upsert({
    where: { name: 'cedric' },
    update: {},
    create: {
      name: 'cedric',
      password: 'cedric',
    },
  });
  console.log(`User created: ${user.name}`);

  // Base Map Categories
  const categories = [
    { id: 'pub', label: '🍻 Pub / Bar', color: '#f59e0b' },
    { id: 'gas', label: '⛽ Gas Station', color: '#ef4444' },
    { id: 'school', label: '🏫 School', color: '#3b82f6' },
    { id: 'hospital', label: '🏥 Hospital', color: '#ec4899' },
    { id: 'park', label: '🌲 Park / Nature', color: '#10b981' },
    { id: 'restaurant', label: '🍽️ Restaurant', color: '#8b5cf6' },
    { id: 'cafe', label: '☕ Cafe / Bakery', color: '#d946ef' },
    { id: 'museum', label: '🏛️ Museum / Art', color: '#0ea5e9' },
    { id: 'gym', label: '🏋️ Gym / Fitness', color: '#f97316' },
    { id: 'library', label: '📚 Library', color: '#6366f1' },
    { id: 'shopping', label: '🛍️ Shopping', color: '#14b8a6' },
    { id: 'viewpoint', label: '🌄 Scenic Viewpoint', color: '#eab308' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { label: cat.label, color: cat.color },
      create: { id: cat.id, label: cat.label, color: cat.color },
    });
  }
  
  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
