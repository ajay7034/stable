import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {load} from 'cheerio';
const origin=process.env.EXPORT_ORIGIN||'http://127.0.0.1:3000';
const site=process.env.PAGES_URL||'https://ajay7034.github.io/stable';
const base=new URL(site).pathname.replace(/\/$/,'');
const out=path.resolve('pages-out');
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
await fs.cp('public',out,{recursive:true});
await fs.cp('.next/static',path.join(out,'_next/static'),{recursive:true,filter:s=>!s.endsWith('.js')&&!s.endsWith('.map')});
await fs.mkdir(path.join(out,'assets'),{recursive:true});
const images=new Map();
async function localAsset(url){
 if(!url.startsWith('/_next/image')&&!url.startsWith('/api/v1/media/')&&!url.startsWith('/api/v1/documents/')&&!url.startsWith('/icon.png?'))return url;
 if(images.has(url))return images.get(url);
 const promise=(async()=>{const response=await fetch(origin+url,{headers:{Accept:'image/webp,image/png,*/*'}});if(!response.ok)throw Error('Asset failed: '+url);const type=response.headers.get('content-type')||'';const ext=type.includes('webp')?'webp':type.includes('png')?'png':type.includes('pdf')?'pdf':'jpg';const filename='assets/'+crypto.createHash('sha256').update(url).digest('hex').slice(0,18)+'.'+ext;await fs.writeFile(path.join(out,filename),Buffer.from(await response.arrayBuffer()));return '/'+filename})();images.set(url,promise);return promise;
}
function href(url){if(!url)return url;if(url.startsWith('http://localhost:3000'))url=url.slice(21);if(url.startsWith(origin))url=url.slice(origin.length);if(!url.startsWith('/')||url.startsWith('//'))return url;const parsed=new URL(url,'https://local.invalid');const pathname=parsed.pathname;const isFile=/\.[a-z0-9]+$/i.test(pathname);return base+pathname+(!isFile&&!pathname.endsWith('/')?'/':'')+parsed.search+parsed.hash;}
async function records(module){let list=[];for(let page=1;;page++){const response=await fetch(origin+'/api/v1/'+module+'?per_page=100&page='+page);if(!response.ok)throw Error('Content export failed');const r=await response.json();list.push(...r.data);if(page>=r.meta.pages)break}return list}
const [pages,categories,products,blogs,jobs]=await Promise.all(['pages','categories','products','blogs','careers'].map(records));
const settings=(await(await fetch(origin+'/api/v1/settings')).json()).data;
const navigation=(await(await fetch(origin+'/api/v1/navigation')).json()).data;
const routes=[...new Set(['/', '/products','/blogs','/careers',...pages.filter(p=>p.slug!=='home').map(p=>'/'+p.slug),...categories.map(p=>'/products/category/'+p.slug),...products.map(p=>'/products/'+p.slug),...blogs.map(p=>'/blogs/'+p.slug),...jobs.map(p=>'/careers/'+p.slug)])];
for(const route of routes){
 const response=await fetch(origin+route);if(!response.ok)throw Error('Page failed: '+route);const $=load(await response.text());
 $('script').each((_,e)=>{if($(e).attr('type')!=='application/ld+json')$(e).remove();else $(e).text($(e).text().replaceAll('http://localhost:3000',site).replaceAll(origin,site));});
 $('link[rel="preload"],link[rel="modulepreload"],link[rel="prefetch"]').remove();
 $('[class*="reveal-"]').removeClass('reveal-ready reveal-visible');
 for(const el of $('[src],[srcset],[href],[action]').toArray()){
  for(const attr of ['src','href','action']){const value=$(el).attr(attr);if(value)$(el).attr(attr,href(await localAsset(value)));}
  const set=$(el).attr('srcset');if(set){const items=await Promise.all(set.split(',').map(async candidate=>{const [url,size]=candidate.trim().split(/\s+/);return href(await localAsset(url))+(size?' '+size:'')}));$(el).attr('srcset',items.join(', '));}
 }
 $('link[rel="canonical"]').attr('href',site+(route==='/'?'/':route+'/'));
 $('meta[property="og:url"]').attr('content',site+(route==='/'?'/':route+'/'));
 for(const el of $('meta[property="og:image"],meta[name="twitter:image"]').toArray()){let url=$(el).attr('content')||'';url=url.replace('http://localhost:3000','').replace(origin,'');if(url.startsWith('https://')&&new URL(url).host===new URL(site).host){url=new URL(url).pathname;if(base&&url.startsWith(base+'/'))url=url.slice(base.length)}if(url.startsWith('/'))$(el).attr('content',new URL(href(await localAsset(url)),new URL(site).origin).href);}
 $('a[href*="/admin"]').remove();
 // Static hosting sends enquiries through the visitor's email application.
 $('form.inquiry').each((_,el)=>{const f=$(el);f.attr('data-direct-enquiry','true');f.find('[name=name],[name=email],[name=phone],[name=message],[name=consent]').attr('required','');f.find('[name=message]').attr('minlength','10');f.find('input[type=file]').closest('label').remove();f.find('button[type=submit],button:not([type])').text('Compose email enquiry');f.find('[role=status]').text('This opens your email app. Send the message there; you can attach your material list before sending.');});
 $('button').filter((_,e)=>/Add to quote|Add to quotation/i.test($(e).text())).replaceWith(`<a class="button" href="${href('/request-quote')}">Enquire about this material</a>`);
 if(route==='/request-quote')$('main').find('button').filter((_,e)=>/clear|remove|update/i.test($(e).text())).remove();
 $('body').append('<script defer src="'+base+'/pages-client.js"></script>');
 const dest=path.join(out,route==='/'?'':route);await fs.mkdir(dest,{recursive:true});await fs.writeFile(path.join(dest,'index.html'),$.html());
 console.log('Exported '+route);
}
await fs.writeFile(path.join(out,'pages-data.json'),JSON.stringify({base,email:settings.email,phone:settings.phone,whatsapp:settings.whatsapp,categories:categories.map(c=>({title:c.title,slug:c.slug,id:c.id})),menu:navigation.filter(n=>n.group_name==='header').map(n=>({label:n.label,href:n.href}))}));
await fs.copyFile('scripts/pages-client.js',path.join(out,'pages-client.js'));
await fs.writeFile(path.join(out,'.nojekyll'),'');
await fs.writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);
await fs.writeFile(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(r=>'<url><loc>'+site+(r==='/'?'/':r+'/')+'</loc></url>').join('')+'</urlset>');
await fs.writeFile(path.join(out,'404.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found | Stable</title><body style="font-family:Arial;padding:10%;background:#132e3a;color:white"><h1>Let’s get you back on solid ground.</h1><p>This page is unavailable.</p><a style="color:#e8c453" href="${base}/">Return to Stable</a></body></html>`);
console.log('Static site ready: '+out);
