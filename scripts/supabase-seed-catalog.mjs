/**
 * Nạp danh mục sản phẩm mẫu (src/data/seed.ts, dữ liệu khảo sát "DS sản phẩm Lào Cai") vào cơ sở dữ liệu ĐANG CHẠY.
 *
 * Vì sao cần: app chỉ nạp dữ liệu mẫu khi cơ sở dữ liệu còn trống, và ở chế độ thật (DEMO_MODE=false) không nạp sản phẩm mẫu.
 * Script này CHỈ THÊM bản ghi còn thiếu theo mã (HTX, tài khoản HTX, sản phẩm); không sửa, không xoá dữ liệu đã có.
 *
 * Cách dùng:
 *   node scripts/supabase-seed-catalog.mjs --env .env.vercel            # chạy thử: chỉ in ra những gì sẽ thêm
 *   node scripts/supabase-seed-catalog.mjs --env .env.vercel --apply    # sao lưu dữ liệu hiện tại ra data/backups rồi ghi
 * Không có --env thì đọc .env / .env.local như server.
 */
import '../server/register.mjs';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {resolve} from 'node:path';

const args=process.argv.slice(2),apply=args.includes('--apply'),envIndex=args.indexOf('--env');
// --sql <file>: không ghi gì vào cơ sở dữ liệu; xuất file SQL để dán vào Supabase SQL Editor.
const sqlIndex=args.indexOf('--sql'),sqlFile=sqlIndex>=0?(args[sqlIndex+1]??'data/supabase-seed-catalog.sql'):null;
if(apply&&sqlFile)throw new Error('Chọn --apply hoặc --sql, không dùng cả hai.');
if(envIndex>=0){
  const file=args[envIndex+1];if(!file||!existsSync(file))throw new Error('Không tìm thấy file môi trường: '+file);
  for(const [key,value] of Object.entries(parseEnv(readFileSync(file,'utf8'))))process.env[key]??=value;
}
const {configuration}=await import('../server/config.mjs');
const {openDatabase}=await import('../server/postgres-database.mjs');
const {createSeedState}=await import('../src/data/seed.ts');

const options=configuration();
console.log(`Cơ sở dữ liệu: ${options.databaseProvider} · chế độ ${options.demo?'demo':'thật'} · ${apply?'GHI':sqlFile?'XUẤT SQL':'CHẠY THỬ'}`);
const db=await openDatabase(options);
try{
  const seed=createSeedState(new Date());
  const result=await db.transaction(async()=>{
    const {state,version}=await db.read();
    const has=(list,id)=>(list??[]).some(x=>x.id===id);
    const phoneTaken=phone=>state.users.some(u=>u.phone===phone);
    const coops=seed.coops.filter(c=>!has(state.coops,c.id));
    const users=seed.users.filter(u=>u.role==='coop'&&!has(state.users,u.id)&&!phoneTaken(u.phone));
    const products=seed.products.filter(p=>!has(state.products,p.id));
    // Sản phẩm phải thuộc một HTX có trong dữ liệu sau khi thêm.
    const coopIds=new Set([...state.coops,...coops].map(c=>c.id));
    const orphan=products.filter(p=>!coopIds.has(p.coopId));
    if(orphan.length)throw new Error('Sản phẩm không có HTX: '+orphan.map(p=>p.id).join(', '));
    const summary={version,coops:coops.map(c=>c.name),coopUsers:users.map(u=>`${u.name} (${u.phone})`),products:products.map(p=>`${p.name} – ${p.unit}`)};
    if(!coops.length&&!users.length&&!products.length)return summary;
    if(sqlFile){
      const next={...state,coops:[...state.coops,...coops],users:[...state.users,...users],products:[...state.products,...products]};
      const data=db.encodeJSON(next).replaceAll("'","''");
      const sql=`-- Nạp danh mục sản phẩm mẫu (${products.length} sản phẩm, ${coops.length} HTX, ${users.length} tài khoản HTX).
-- Tạo lúc ${new Date().toISOString()} từ app_state phiên bản ${version}. Dữ liệu đã mã hoá bằng DATA_ENCRYPTION_KEY của app.
-- Chỉ chạy được khi app_state vẫn ở phiên bản ${version}; nếu web đã có thay đổi, câu lệnh tự huỷ và không ghi gì.
begin;

-- 1. Sao lưu bản hiện tại (khôi phục: xem cuối file).
create table if not exists app_private.app_state_backup_catalog (id int, version bigint, data text, backed_up_at timestamptz);
insert into app_private.app_state_backup_catalog select id, version, data, now() from app_private.app_state where id = 1;

-- 2. Ghi dữ liệu mới.
do $$
begin
  update app_private.app_state set version = version + 1, data = '${data}' where id = 1 and version = ${version};
  if not found then
    raise exception 'app_state không còn ở phiên bản ${version}: tạo lại file SQL bằng npm run supabase:seed-catalog -- --env .env.vercel --sql';
  end if;
end $$;

commit;

-- Kiểm tra: phiên bản phải là ${version + 1}.
select id, version from app_private.app_state;

-- Khôi phục nếu cần (bỏ dấu -- rồi chạy):
-- update app_private.app_state s set version = s.version + 1, data = b.data
--   from (select data from app_private.app_state_backup_catalog order by backed_up_at desc limit 1) b where s.id = 1;
`;
      mkdirSync(resolve(sqlFile,'..'),{recursive:true});writeFileSync(sqlFile,sql);
      return {...summary,sqlFile:resolve(sqlFile),bytes:sql.length};
    }
    if(!apply)return summary;
    // Sao lưu nguyên khối dữ liệu đã mã hoá (đúng như trong bảng app_state) trước khi ghi.
    const raw=await db.sql.prepare('SELECT version,data FROM app_state WHERE id=1').get();
    mkdirSync('data/backups',{recursive:true});
    const backup=resolve(`data/backups/app_state-v${raw.version}-${new Date().toISOString().replaceAll(':','-')}.json`);
    writeFileSync(backup,JSON.stringify(raw));
    state.coops=[...state.coops,...coops];
    state.users=[...state.users,...users];
    state.products=[...state.products,...products];
    await db.save(state);
    await db.audit(null,'catalog-seed-import','products',`${products.length} sản phẩm, ${coops.length} HTX`);
    return {...summary,backup,applied:true};
  });
  console.log(JSON.stringify(result,null,2));
  if(sqlFile)console.log('\nChưa ghi gì vào cơ sở dữ liệu. Mở file SQL ở trên, dán vào Supabase → SQL Editor rồi bấm Run.');
  else if(!apply)console.log('\nChưa ghi gì. Thêm --apply để ghi, hoặc --sql để xuất file SQL dán vào Supabase.');
}finally{await db.close();}
