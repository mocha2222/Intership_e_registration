import { AppDataSource } from './data-source';

async function generate() {
  await AppDataSource.initialize();
  const sqlInMemory = await AppDataSource.driver.createSchemaBuilder().log();
  console.log('--- UP QUERIES ---');
  sqlInMemory.upQueries.forEach(q => console.log(q.query + ';'));
  console.log('--- DOWN QUERIES ---');
  sqlInMemory.downQueries.forEach(q => console.log(q.query + ';'));
  await AppDataSource.destroy();
}

generate().catch(console.error);
