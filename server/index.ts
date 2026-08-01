import express from 'express';
import cors from 'cors';
import { createReadStream, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname, basename, dirname, join, resolve, relative, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createServer as createViteServer } from 'vite';

type Video = { id:string; name:string; path:string; rootPath:string; extension:string; size:number; modifiedAt:number; folder:string; tags:string[]; native:boolean; vr:boolean; rating:'good'|'medium'|'bad'|null };
type Library = { directories:string[]; videos:Video[] };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, '.luma');
const cacheDir = join(dataDir, 'cache');
mkdirSync(cacheDir, { recursive:true });
const sql = new DatabaseSync(join(dataDir, 'library.sqlite'));
sql.exec(`PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS directories (path TEXT PRIMARY KEY);
  CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT UNIQUE NOT NULL, extension TEXT, size INTEGER, modified_at REAL, folder TEXT, tags TEXT, native INTEGER, vr INTEGER);
  CREATE TABLE IF NOT EXISTS scan_extensions (extension TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS playback_history (video_id TEXT PRIMARY KEY, watched_at REAL NOT NULL, progress REAL NOT NULL DEFAULT 0, duration REAL NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS library_tags (name TEXT PRIMARY KEY, created_at REAL NOT NULL);
  CREATE TABLE IF NOT EXISTS scan_exclusions (pattern TEXT PRIMARY KEY);`);
try { sql.exec('ALTER TABLE directories ADD COLUMN last_scanned REAL'); } catch {}
try { sql.exec('ALTER TABLE videos ADD COLUMN root_path TEXT'); } catch {}
try { sql.exec('ALTER TABLE videos ADD COLUMN rating TEXT'); } catch {}
const legacyDirectories = (sql.prepare('SELECT path FROM directories ORDER BY length(path) DESC').all() as {path:string}[]).map(x=>x.path);
const legacyVideos = sql.prepare("SELECT id,path FROM videos WHERE root_path IS NULL OR root_path='' ").all() as {id:string;path:string}[];
const setRoot = sql.prepare('UPDATE videos SET root_path=? WHERE id=?');
for (const video of legacyVideos) { const owner=legacyDirectories.find(dir=>video.path===dir||video.path.startsWith(dir+sep)); if(owner)setRoot.run(owner,video.id); }
const supportedFormats = ['mp4','webm','mov','mkv','wmv','avi','m4v','ogv','mpeg','mpg','ts','mts','m2ts'];
const addExtension = sql.prepare('INSERT OR IGNORE INTO scan_extensions(extension,enabled) VALUES (?,?)');
for (const extension of supportedFormats) addExtension.run(extension, Number(!['ts','mts'].includes(extension)));
const defaultExclusions=['Library','node_modules','.git','.Trash','Caches','.cache','.npm','.cargo','.local','.hermes','.real_chrome_cdp_profile','DerivedData','Applications'];
const addExclusion=sql.prepare('INSERT OR IGNORE INTO scan_exclusions(pattern) VALUES (?)');
for(const pattern of defaultExclusions)addExclusion.run(pattern);
const enabledFormats = () => new Set((sql.prepare('SELECT extension FROM scan_extensions WHERE enabled=1').all() as {extension:string}[]).map(x=>'.'+x.extension));
const excludedDirectories=()=>new Set((sql.prepare('SELECT pattern FROM scan_exclusions').all() as {pattern:string}[]).map(x=>x.pattern));
const browserNative = new Set(['.mp4','.webm','.m4v','.ogv']);
const idFor = (path:string) => createHash('sha1').update(path).digest('hex').slice(0,16);
const execFileAsync = promisify(execFile);

function readDb():Library {
  const directories = (sql.prepare('SELECT path FROM directories ORDER BY path').all() as {path:string}[]).map(x => x.path);
  const videos = (sql.prepare('SELECT * FROM videos ORDER BY modified_at DESC').all() as Record<string,unknown>[]).map(r => ({
    id:String(r.id), name:String(r.name), path:String(r.path), rootPath:String(r.root_path || ''), extension:String(r.extension), size:Number(r.size), modifiedAt:Number(r.modified_at), folder:String(r.folder),
    tags:JSON.parse(String(r.tags || '[]')) as string[], native:Boolean(r.native), vr:Boolean(r.vr), rating:['good','medium','bad'].includes(String(r.rating))?r.rating as Video['rating']:null,
  }));
  return { directories, videos };
}
function registerCurrentTags(){const insert=sql.prepare('INSERT OR IGNORE INTO library_tags(name,created_at) VALUES (?,?)');for(const tag of new Set(readDb().videos.flatMap(v=>v.tags)))insert.run(tag,Date.now());}
function tagDetails(){const counts=new Map<string,number>();for(const video of readDb().videos)for(const tag of video.tags)counts.set(tag,(counts.get(tag)||0)+1);return (sql.prepare('SELECT name,created_at AS createdAt FROM library_tags ORDER BY name').all() as {name:string;createdAt:number}[]).map(tag=>({...tag,videoCount:counts.get(tag.name)||0}));}
registerCurrentTags();
let library = readDb();

type ScanJob={id:string;directory:string;status:'running'|'completed'|'cancelled'|'failed';scannedFiles:number;foundVideos:number;currentPath:string;error?:string;cancelled:boolean;startedAt:number;finishedAt?:number};
const scanJobs=new Map<string,ScanJob>();
async function walk(dir:string, rootDir:string, out:Video[], job?:ScanJob, skip?:Set<string>, allowed?:Set<string>) {
  if(job?.cancelled)return;
  const formats=allowed||enabledFormats();
  const exclusions=skip||excludedDirectories();
  let entries;
  try { entries=await readdir(dir, { withFileTypes:true }); }
  catch(error) { const code=(error as NodeJS.ErrnoException).code; if(['EACCES','EPERM','ENOENT'].includes(code||''))return; throw error; }
  for (const entry of entries) {
    if(job?.cancelled)return;
    const path = join(dir, entry.name);
    if(job){job.currentPath=path;if(!entry.isDirectory())job.scannedFiles++;}
    if (entry.isDirectory()) { if(!exclusions.has(entry.name))await walk(path, rootDir, out,job,exclusions,formats); }
    else if (formats.has(extname(entry.name).toLowerCase())) {
      const info = await stat(path);
      const extension = extname(entry.name).slice(1).toLowerCase();
      const nested = relative(rootDir, dir).split(sep).filter(x => x && x !== '.');
      const tags = [basename(rootDir), ...nested].filter((x,i,a) => a.indexOf(x) === i);
      out.push({ id:idFor(path), name:basename(entry.name,extname(entry.name)), path, rootPath:rootDir, extension, size:info.size, modifiedAt:info.mtimeMs, folder:basename(dir), tags, native:browserNative.has('.'+extension), vr:/(^|[ ._-])(vr|180|360)([ ._-]|$)/i.test(entry.name), rating:null });
      if(job)job.foundVideos=out.length;
    }
  }
}
async function scan() {
  const videos:Video[] = [];
  library = readDb();
  const ratings=new Map(library.videos.map(v=>[v.path,v.rating]));
  for (const dir of library.directories) if (existsSync(dir)) await walk(dir,dir,videos);
  const insert = sql.prepare('INSERT INTO videos (id,name,path,root_path,extension,size,modified_at,folder,tags,native,vr,rating) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  sql.exec('BEGIN');
  try {
    sql.exec('DELETE FROM videos');
    for (const v of videos) insert.run(v.id,v.name,v.path,v.rootPath,v.extension,v.size,v.modifiedAt,v.folder,JSON.stringify(v.tags),Number(v.native),Number(v.vr),ratings.get(v.path)||null);
    sql.prepare('UPDATE directories SET last_scanned=?').run(Date.now());
    sql.exec('COMMIT');
  } catch (error) { sql.exec('ROLLBACK'); throw error; }
  library = readDb();
  registerCurrentTags();
  return library;
}
async function addDirectory(dir:string) {
  const currentDirectories=readDb().directories;
  const exists = currentDirectories.includes(dir);
  if (exists) return { ...readDb(), alreadyExists:true };
  const parent=currentDirectories.find(existing=>dir.startsWith(existing+sep));
  if(parent)throw new Error(`此目錄已包含在現有來源「${parent}」中，請直接掃描該來源。`);
  const child=currentDirectories.find(existing=>existing.startsWith(dir+sep));
  if(child)throw new Error(`此目錄包含已加入的來源「${child}」，請先移除重疊來源。`);
  sql.prepare('INSERT INTO directories(path,last_scanned) VALUES (?,NULL)').run(dir);
  library=readDb();
  return { ...library, alreadyExists:false };
}
function removeDirectory(dir:string) {
  sql.exec('BEGIN');
  try {
    sql.prepare('DELETE FROM directories WHERE path=?').run(dir);
    sql.prepare('DELETE FROM videos WHERE root_path=?').run(dir);
    sql.exec('COMMIT');
  } catch (error) { sql.exec('ROLLBACK'); throw error; }
  library=readDb();
  return library;
}
function directoryDetails() {
  return sql.prepare(`SELECT d.path, d.last_scanned AS lastScanned, COUNT(v.id) AS videoCount
    FROM directories d LEFT JOIN videos v ON v.root_path=d.path GROUP BY d.path ORDER BY d.path`).all();
}
async function scanOne(dir:string,job?:ScanJob) {
  if (!readDb().directories.includes(dir)) throw new Error('片庫中沒有這個路徑。');
  if (!existsSync(dir)) throw new Error('目錄目前不存在或無法存取。');
  const videos:Video[]=[];
  await walk(dir,dir,videos,job);
  if(job?.cancelled)return directoryDetails();
  if(!readDb().directories.includes(dir))throw new Error('掃描期間目錄已從片庫移除。');
  const ratings=new Map(readDb().videos.filter(v=>v.rootPath===dir).map(v=>[v.path,v.rating]));
  const insert=sql.prepare('INSERT INTO videos (id,name,path,root_path,extension,size,modified_at,folder,tags,native,vr,rating) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  sql.exec('BEGIN');
  try {
    sql.prepare('DELETE FROM videos WHERE root_path=?').run(dir);
    for(const v of videos) insert.run(v.id,v.name,v.path,v.rootPath,v.extension,v.size,v.modifiedAt,v.folder,JSON.stringify(v.tags),Number(v.native),Number(v.vr),ratings.get(v.path)||null);
    sql.prepare('UPDATE directories SET last_scanned=? WHERE path=?').run(Date.now(),dir);
    sql.exec('COMMIT');
  } catch(error) { sql.exec('ROLLBACK'); throw error; }
  library=readDb();
  registerCurrentTags();
  return directoryDetails();
}
const findVideo = (id:string) => { library=readDb(); return library.videos.find(v=>v.id===id); };
const app = express();
app.use(cors()); app.use(express.json());
app.get('/api/library', (_q,r) => r.json(readDb()));
app.get('/api/admin/directories', (_q,r) => r.json(directoryDetails()));
app.get('/api/admin/scans/:id', (q,r) => {const job=scanJobs.get(q.params.id);if(!job)return r.status(404).json({error:'找不到掃描工作。'});r.json(job);});
app.delete('/api/admin/scans/:id', (q,r) => {const job=scanJobs.get(q.params.id);if(!job)return r.status(404).json({error:'找不到掃描工作。'});if(job.status==='running'){job.cancelled=true;job.status='cancelled';job.finishedAt=Date.now();}r.json(job);});
app.get('/api/admin/exclusions', (_q,r) => r.json([...excludedDirectories()].sort((a,b)=>a.localeCompare(b))));
app.post('/api/admin/exclusions', (q,r) => {const pattern=String(q.body.pattern||'').trim();if(!pattern||pattern.includes('/')||pattern.includes('\\'))return r.status(400).json({error:'請輸入單一目錄名稱，不要包含斜線。'});addExclusion.run(pattern);r.json([...excludedDirectories()].sort((a,b)=>a.localeCompare(b)));});
app.delete('/api/admin/exclusions', (q,r) => {sql.prepare('DELETE FROM scan_exclusions WHERE pattern=?').run(String(q.body.pattern||''));r.json([...excludedDirectories()].sort((a,b)=>a.localeCompare(b)));});
app.get('/api/admin/tags', (_q,r) => r.json(tagDetails()));
app.post('/api/admin/tags/cleanup', (_q,r) => { const used=new Set(readDb().videos.flatMap(v=>v.tags)); const all=sql.prepare('SELECT name FROM library_tags').all() as {name:string}[]; const remove=sql.prepare('DELETE FROM library_tags WHERE name=?'); let removed=0; for(const tag of all)if(!used.has(tag.name)){remove.run(tag.name);removed++;} r.json({removed,tags:tagDetails()}); });
app.post('/api/admin/reset', (q,r) => { if(q.body.confirmation!=='RESET')return r.status(400).json({error:'確認文字不正確。'}); try { for(const process of processes.values())process.kill('SIGTERM');processes.clear();for(const job of scanJobs.values())job.cancelled=true;scanJobs.clear();sql.exec('BEGIN');try{sql.exec('DELETE FROM playback_history; DELETE FROM videos; DELETE FROM directories; DELETE FROM library_tags; DELETE FROM scan_extensions; DELETE FROM scan_exclusions;');for(const extension of supportedFormats)addExtension.run(extension,Number(!['ts','mts'].includes(extension)));for(const pattern of defaultExclusions)addExclusion.run(pattern);sql.exec('COMMIT');}catch(error){sql.exec('ROLLBACK');throw error;}rmSync(cacheDir,{recursive:true,force:true});mkdirSync(cacheDir,{recursive:true});library=readDb();r.json({ok:true});}catch(error){r.status(500).json({error:error instanceof Error?error.message:String(error)});} });
app.get('/api/admin/extensions', (_q,r) => r.json(sql.prepare('SELECT extension,enabled FROM scan_extensions ORDER BY extension').all()));
app.get('/api/admin/ratings', (_q,r) => r.json(sql.prepare(`SELECT rating,COUNT(*) AS count FROM videos WHERE rating IN ('good','medium','bad') GROUP BY rating`).all()));
app.get('/api/history', (_q,r) => r.json(sql.prepare(`SELECT h.video_id AS videoId,h.watched_at AS watchedAt,h.progress,h.duration FROM playback_history h INNER JOIN videos v ON v.id=h.video_id ORDER BY h.watched_at DESC`).all()));
app.put('/api/history/:id', (q,r) => { if(!sql.prepare('SELECT 1 FROM videos WHERE id=?').get(q.params.id))return r.status(404).json({error:'找不到影片。'}); const progress=Math.max(0,Number(q.body.progress)||0),duration=Math.max(0,Number(q.body.duration)||0); sql.prepare(`INSERT INTO playback_history(video_id,watched_at,progress,duration) VALUES (?,?,?,?) ON CONFLICT(video_id) DO UPDATE SET watched_at=excluded.watched_at,progress=excluded.progress,duration=excluded.duration`).run(q.params.id,Date.now(),progress,duration); r.json({ok:true}); });
app.delete('/api/history', (_q,r) => { sql.exec('DELETE FROM playback_history'); r.json({ok:true}); });
app.get('/api/admin/ratings/export', (q,r) => { const rating=String(q.query.rating||''); if(!['good','medium','bad'].includes(rating))return r.status(400).json({error:'無效的評分類型。'}); const rows=sql.prepare('SELECT name,path,extension,root_path FROM videos WHERE rating=? ORDER BY name').all(rating) as Record<string,unknown>[]; const label={good:'好',medium:'中等',bad:'不好'}[rating as 'good'|'medium'|'bad']; const cell=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`; const csv='\uFEFF'+['評分','影片名稱','完整路徑','副檔名','來源目錄'].map(cell).join(',')+'\n'+rows.map(row=>[label,row.name,row.path,row.extension,row.root_path].map(cell).join(',')).join('\n'); r.setHeader('Content-Type','text/csv; charset=utf-8');r.setHeader('Content-Disposition',`attachment; filename="luma-${rating}-videos.csv"`);r.send(csv); });
app.put('/api/admin/extensions', (q,r) => { try { const values=Array.isArray(q.body.extensions)?q.body.extensions.map((x:unknown)=>String(x).toLowerCase()):[]; const unknown=values.filter((x:string)=>!supportedFormats.includes(x)); if(unknown.length)return r.status(400).json({error:`不支援的副檔名：${unknown.join(', ')}`}); const update=sql.prepare('UPDATE scan_extensions SET enabled=? WHERE extension=?'); sql.exec('BEGIN'); try { for(const extension of supportedFormats)update.run(Number(values.includes(extension)),extension); sql.exec('COMMIT'); }catch(error){sql.exec('ROLLBACK');throw error;} r.json(sql.prepare('SELECT extension,enabled FROM scan_extensions ORDER BY extension').all()); } catch(e) { r.status(400).json({error:e instanceof Error?e.message:String(e)}); } });
app.put('/api/videos/:id/rating', (q,r) => { const rating=q.body.rating===null?null:String(q.body.rating); if(rating!==null&&!['good','medium','bad'].includes(rating))return r.status(400).json({error:'無效的評分。'}); const result=sql.prepare('UPDATE videos SET rating=? WHERE id=?').run(rating,q.params.id); if(!result.changes)return r.status(404).json({error:'找不到影片。'}); r.json({id:q.params.id,rating}); });
app.post('/api/admin/directories/scan', (q,r) => { const dir=resolve(String(q.body.path||''));if(!readDb().directories.includes(dir))return r.status(404).json({error:'片庫中沒有這個路徑。'});const running=[...scanJobs.values()].find(job=>job.directory===dir&&job.status==='running');if(running)return r.status(409).json({error:'此目錄正在掃描中。',job:running});const job:ScanJob={id:createHash('sha1').update(dir+Date.now()).digest('hex').slice(0,12),directory:dir,status:'running',scannedFiles:0,foundVideos:0,currentPath:dir,cancelled:false,startedAt:Date.now()};scanJobs.set(job.id,job);void scanOne(dir,job).then(()=>{if(!job.cancelled){job.status='completed';job.finishedAt=Date.now();}}).catch(error=>{job.status='failed';job.error=error instanceof Error?error.message:String(error);job.finishedAt=Date.now();});r.status(202).json(job); });
app.post('/api/library/scan', async (_q,r) => { try { r.json(await scan()); } catch(e) { r.status(500).json({error:String(e)}); } });
app.post('/api/library/directories', async (q,r) => { try { const dir=resolve(String(q.body.path||'')); if(!existsSync(dir)||!statSync(dir).isDirectory()) return r.status(400).json({error:'找不到這個目錄，請確認完整路徑。'}); r.json(await addDirectory(dir)); } catch(e) { r.status(500).json({error:String(e)}); } });
app.delete('/api/library/directories', (q,r) => { try { const dir=resolve(String(q.body.path||'')); if(!readDb().directories.includes(dir)) return r.status(404).json({error:'片庫中沒有這個路徑。'}); r.json(removeDirectory(dir)); } catch(e) { r.status(500).json({error:String(e)}); } });
app.post('/api/library/pick-directory', async (_q,r) => {
  if (process.platform !== 'darwin') return r.status(501).json({error:'目前點選目錄功能支援 macOS，其他系統可先輸入完整路徑。'});
  let dir:string;
  try {
    const { stdout } = await execFileAsync('osascript', ['-e', 'POSIX path of (choose folder with prompt "選擇要加入 Hinami Player 的影片目錄")']);
    dir = resolve(stdout.trim());
    if (!dir || !existsSync(dir) || !statSync(dir).isDirectory()) return r.status(400).json({error:'未選擇有效的目錄。'});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('User canceled') || message.includes('-128')) return r.status(409).json({error:'已取消選擇。', canceled:true});
    console.error('Folder picker failed:',message);
    return r.status(500).json({error:`無法開啟資料夾選擇器：${message.split('\n')[0]}`});
  }
  try { r.json(await addDirectory(dir)); }
  catch(error) { const message=error instanceof Error?error.message:String(error); console.error('Adding directory failed:',message); r.status(400).json({error:message}); }
});
app.get('/api/video/:id', (q,r) => { const v=findVideo(q.params.id); if(!v)return r.sendStatus(404); const size=statSync(v.path).size, range=q.headers.range; r.setHeader('Accept-Ranges','bytes'); if(!range){r.setHeader('Content-Length',size);return createReadStream(v.path).pipe(r);} const [a,b]=range.replace('bytes=','').split('-'), start=Number(a), end=b?Number(b):size-1; r.status(206).set({'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':String(end-start+1),'Content-Type':v.extension==='webm'?'video/webm':'video/mp4'}); createReadStream(v.path,{start,end}).pipe(r); });
const processes = new Map<string,ReturnType<typeof spawn>>();
const thumbnailFallback=(name:string,wide:boolean)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${wide?1280:640}" height="${wide?720:360}" viewBox="0 0 640 360"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#20262b"/><stop offset="1" stop-color="#0e1114"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="320" cy="165" r="38" fill="#b7ff34" opacity=".9"/><path d="M310 143l31 22-31 22z" fill="#101309"/><text x="320" y="235" text-anchor="middle" fill="#92999f" font-family="sans-serif" font-size="15">${name.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`)}</text></svg>`;
app.get('/api/thumbnail/:id', (q,r) => {
  const v=findVideo(q.params.id); if(!v)return r.status(404).type('svg').send(thumbnailFallback('找不到影片',false));
  const wide=Boolean(q.query.wide), file=join(cacheDir,`${v.id}${wide?'w':''}.jpg`);
  const fallback=()=>{if(!r.headersSent)r.status(200).type('image/svg+xml').send(thumbnailFallback(v.name,wide));};
  const send=()=>r.sendFile(file,error=>{if(error)fallback();});
  if(existsSync(file)&&statSync(file).size>0)return send();
  const size=wide?'1280:720':'640:360';
  const p=spawn('ffmpeg',['-loglevel','error','-ss','00:00:01','-i',v.path,'-frames:v','1','-vf',`scale=${size}:force_original_aspect_ratio=increase,crop=${size}`,'-q:v','3','-y',file]);
  p.once('error',fallback); p.once('close',()=>existsSync(file)&&statSync(file).size>0?send():fallback());
});
app.get('/api/hls/:id/:file', (q,r) => { const v=findVideo(q.params.id); if(!v)return r.sendStatus(404); const dir=join(cacheDir,v.id), target=join(dir,q.params.file); mkdirSync(dir,{recursive:true}); if(existsSync(target))return r.sendFile(target); if(!processes.has(v.id)){const p=spawn('ffmpeg',['-i',v.path,'-c:v','libx264','-preset','veryfast','-crf','22','-c:a','aac','-b:a','160k','-f','hls','-hls_time','4','-hls_list_size','0','-hls_segment_filename',join(dir,'segment%05d.ts'),join(dir,'master.m3u8')]); processes.set(v.id,p);p.on('close',()=>processes.delete(v.id));} let tries=0;const timer=setInterval(()=>{if(existsSync(target)){clearInterval(timer);r.sendFile(target);}else if(++tries>600){clearInterval(timer);r.status(504).json({error:'轉碼逾時'});}},100); });
if(process.argv.includes('--production')) { app.use(express.static(join(root,'dist'))); app.use((q,r,next)=>q.method==='GET'&&!q.path.startsWith('/api/')?r.sendFile(join(root,'dist','index.html')):next()); }
else { const vite=await createViteServer({root,server:{middlewareMode:true},appType:'spa'}); app.use(vite.middlewares); }
app.listen(8787,'127.0.0.1',()=>console.log('Hinami Fucheng Player: http://localhost:8787'));
