import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const permissions = [
  ['dashboard.view','Dashboard View','Dashboard'],['client.view','Client View','Clients'],['client.create','Client Create','Clients'],['client.edit','Client Edit','Clients'],
  ['renewal.process','Renewal Process','Transactions'],['transfer.process','Transfer Process','Transactions'],['violation.view','Violation View','Violations'],['violation.create','Violation Create','Violations'],
  ['violation.edit','Violation Edit','Violations'],['payment.view','Payment View','Payments'],['payment.process','Payment Process','Payments'],['report.view','Report View','Reports'],
  ['report.export','Report Export','Reports'],['document.print','Print Documents','Documents'],['user.manage','User Management','Administration'],['role.manage','Role Management','Administration'],
  ['audit.view','Audit Log View','Administration'],['settings.manage','Settings Management','Administration']
];

async function main() {
  const offices = {};
  for (const [code,name] of [['SUPER','Super Administration'],['BPLO','Business Permit and Licensing Office'],['CTMO','City Traffic Management Office'],['CTO','Finance / City Treasurer Office']]) {
    offices[code] = await prisma.office.upsert({where:{code},update:{name},create:{code,name}});
  }
  for (const [code,label,category] of permissions) await prisma.permission.upsert({where:{code},update:{label,category},create:{code,label,category}});
  const roles = {};
  for (const [name,description,scope] of [['Super Admin','Complete system-wide access','ALL'],['BPLO Admin','Franchise and renewal administration','BPLO'],['CTMO Admin','Violation administration','CTMO'],['Finance Admin','Payment and collection administration','CTO']]) {
    roles[name] = await prisma.role.upsert({where:{name},update:{description,officeScope:scope},create:{name,description,officeScope:scope}});
  }
  const allPerms = await prisma.permission.findMany();
  for (const permission of allPerms) await prisma.rolePermission.upsert({where:{roleId_permissionId:{roleId:roles['Super Admin'].id,permissionId:permission.id}},update:{},create:{roleId:roles['Super Admin'].id,permissionId:permission.id}});
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({where:{email:'admin@tfrs.gov.ph'},update:{passwordHash},create:{name:'Maria Santos',username:'superadmin',email:'admin@tfrs.gov.ph',passwordHash,officeId:offices.SUPER.id,roleId:roles['Super Admin'].id}});
  const toda = await prisma.toda.upsert({where:{code:'CENTODA'},update:{},create:{code:'CENTODA',name:'Central Tricycle Operators and Drivers Association',route:'City Proper – Public Market'}});
  const client = await prisma.client.upsert({where:{id:'sample-client-001'},update:{},create:{id:'sample-client-001',firstName:'Roberto',lastName:'Dela Cruz',address:'Brgy. San Roque, City Proper',contact:'0917 555 0101',email:'roberto@example.com'}});
  const franchise = await prisma.franchise.upsert({where:{mtopNumber:'MTOP-2026-00124'},update:{},create:{mtopNumber:'MTOP-2026-00124',clientId:client.id,todaId:toda.id,status:'ACTIVE',expiryDate:new Date('2026-12-31')}});
  if (await prisma.owner.count({where:{franchiseId:franchise.id}}) === 0) await prisma.owner.create({data:{franchiseId:franchise.id,name:'Roberto Dela Cruz',contact:'0917 555 0101'}});
  if (await prisma.driver.count({where:{franchiseId:franchise.id}}) === 0) await prisma.driver.create({data:{franchiseId:franchise.id,name:'Roberto Dela Cruz',licenseNumber:'N01-23-456789'}});
  if (await prisma.vehicle.count({where:{franchiseId:franchise.id}}) === 0) await prisma.vehicle.create({data:{franchiseId:franchise.id,plateNumber:'TC-1204',makeModel:'Honda TMX 155',color:'Blue'}});
  await prisma.systemSetting.upsert({where:{key:'max_owners'},update:{value:'3'},create:{key:'max_owners',value:'3',group:'Franchise Rules'}});
  await prisma.systemSetting.upsert({where:{key:'max_active_drivers'},update:{value:'1'},create:{key:'max_active_drivers',value:'1',group:'Franchise Rules'}});
  await prisma.auditLog.create({data:{userId:admin.id,officeId:offices.SUPER.id,roleName:'Super Admin',action:'SEED',module:'System',recordId:'INITIAL',description:'Initial demonstration data prepared',ipAddress:'127.0.0.1'}});
}

main().finally(() => prisma.$disconnect());
