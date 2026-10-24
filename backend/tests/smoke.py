"""Local integration test. Requires disposable development DB and running API.
Creates temporary staff accounts and a draft product; removes its records afterward.
"""
import json,secrets,subprocess,urllib.request,urllib.error,http.cookiejar,os
from pathlib import Path
from datetime import datetime,timedelta,timezone
root=Path(__file__).resolve().parents[2]
password=secrets.token_urlsafe(24)
accounts=[('smoke-admin@example.invalid','super_admin'),('smoke-editor@example.invalid','editor')]
php="<?php $db=new SQLite3('/app/backend/writable/stable.sqlite');"
for email,role in accounts:
 php+="$s=$db->prepare('INSERT INTO users(email,password,role) VALUES(:e,:p,:r)');$s->bindValue(':e',"+json.dumps(email)+");$s->bindValue(':p',password_hash("+json.dumps(password)+",PASSWORD_ARGON2ID));$s->bindValue(':r',"+json.dumps(role)+");$s->execute();"
script=root/'backend/writable/smoke-account.php';script.write_text(php);script.chmod(0o600)
subprocess.run(['docker','compose','exec','-T','api','php','writable/smoke-account.php'],cwd=root,check=True,capture_output=True);script.unlink()
def client():return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def req(c,path,data=None,csrf='',method=None):
 r=urllib.request.Request('http://127.0.0.1:8080/api/v1/'+path,data=json.dumps(data).encode() if data is not None else None,headers={'Content-Type':'application/json','X-CSRF-Token':csrf},method=method)
 try:
  with c.open(r) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def multipart(c,path,fields,filename=None,blob=None,mime='application/octet-stream',csrf='',file_field='file'):
 boundary='stable-'+secrets.token_hex(12);parts=[]
 for k,v in fields.items():parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
 if filename:parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode()+blob+b'\r\n')
 parts.append(f'--{boundary}--\r\n'.encode());r=urllib.request.Request('http://127.0.0.1:8080/api/v1/'+path,data=b''.join(parts),headers={'Content-Type':'multipart/form-data; boundary='+boundary,'X-CSRF-Token':csrf})
 try:
  with c.open(r) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
try:
 admin=client();status,res=req(admin,'auth/session');assert status==200
 token=res['data']['csrf'];status,res=req(admin,'auth/login',{'email':accounts[0][0],'password':password},token);assert status==200,(status,res)
 token=res['data']['csrf'];product={'title':'Smoke private product','slug':'smoke-private-product','status':'draft','description':'Test only','body':''}
 assert req(admin,'admin/products',product,token)[0]==200
 assert req(client(),'products/smoke-private-product')[0]==404
 status,res=req(admin,'admin/products');assert status==200
 product['id']=next(p['id'] for p in res['data'] if p['slug']==product['slug'])
 assert req(admin,'admin/products/'+str(product['id']),product,'invalid','PUT')[0]==403
 product['status']='published';assert req(admin,'admin/products/'+str(product['id']),product,token,'PUT')[0]==200
 assert req(client(),'products/smoke-private-product')[0]==200
 # Draft editing preserves the immutable public version, then publishing replaces it.
 product['status']='draft';product['title']='Smoke revised product'
 assert req(admin,'admin/products/'+str(product['id']),product,token,'PUT')[0]==200
 assert req(client(),'products/smoke-private-product')[1]['data']['title']=='Smoke private product'
 product['status']='published';assert req(admin,'admin/products/'+str(product['id']),product,token,'PUT')[0]==200
 assert req(client(),'products/smoke-private-product')[1]['data']['title']=='Smoke revised product'
 # Renamed published slugs resolve to the latest record, used by frontend 308 redirects.
 product['slug']='smoke-renamed-product';assert req(admin,'admin/products/'+str(product['id']),product,token,'PUT')[0]==200
 assert req(client(),'products/smoke-private-product')[1]['data']['slug']=='smoke-renamed-product'
 product['slug']='smoke-private-product';assert req(admin,'admin/products/'+str(product['id']),product,token,'PUT')[0]==200
 assert req(client(),'products?per_page=1')[1]['meta']['per_page']==1
 editor=client();_,res=req(editor,'auth/session');_,res=req(editor,'auth/login',{'email':accounts[1][0],'password':password},res['data']['csrf']);assert req(editor,'admin/products')[0]==403
 assert req(editor,'admin/pages')[0]==200
 _,pages=req(admin,'admin/pages');home_id=next(p['id'] for p in pages['data'] if p['slug']=='home')
 _,section_response=req(admin,'admin/sections/'+str(home_id));sections=section_response['data'];assert len(sections)>=3
 bad_sections=[{**sections[0],'button_href':'javascript:alert(1)'}]
 assert req(admin,'admin/sections/'+str(home_id),bad_sections,token,'PUT')[0]==400
 assert req(client(),'admin/sections/'+str(home_id))[0]==403
 assert req(editor,'admin/users')[0]==403
 assert req(client(),'admin/media')[0]==403
 fields={'alt':'Smoke licensed image','owner':'Test owner','license':'Test fixture','source_url':''}
 assert multipart(admin,'admin/media',fields,'bad.php',b'<?php echo 1;','image/png',token)[0]==400
 status,res=multipart(admin,'admin/media',fields,'fixture.png',(root/'frontend/public/logo.png').read_bytes(),'image/png',token);assert status==201,(status,res)
 _,res=req(admin,'admin/media');media_id=next(m['id'] for m in res['data'] if m['alt']=='Smoke licensed image')
 assert req(client(),'media/'+str(media_id))[0]==404
 product['cover_id']=media_id;assert req(admin,'admin/products/'+str(product['id']),product,token,'PUT')[0]==200
 assert req(admin,'admin/media/'+str(media_id),{},token,'DELETE')[0]==409
 details={'specifications':[{'label':'Finish','value':'Fixture finish'}],'variants':[{'label':'Size','value':'Fixture size'}],'gallery':[media_id]}
 assert req(admin,'admin/details/'+str(product['id']),details,token,'PUT')[0]==200
 assert req(client(),'products/smoke-private-product')[1]['data']['gallery']==[]
 assert req(admin,'admin/bulk/products',{'ids':[product['id']],'status':'published'},token)[0]==200
 public=req(client(),'products/smoke-private-product')[1]['data'];assert public['gallery'][0]['media_id']==media_id;assert public['specifications_list'][0]['value']=='Fixture finish'
 assert req(admin,'admin/faqs/products/'+str(product['id']),[{'question':'Fixture question?','answer':'Fixture answer.'}],token,'PUT')[0]==200
 assert req(client(),'products/smoke-private-product')[1]['data']['faqs']==[]
 assert req(admin,'admin/bulk/products',{'ids':[product['id']],'status':'published'},token)[0]==200
 assert req(client(),'products/smoke-private-product')[1]['data']['faqs'][0]['answer']=='Fixture answer.'
 assert req(editor,'admin/details/'+str(product['id']))[0]==403
 assert req(admin,'admin/details/'+str(product['id']),{'specifications':[],'variants':[],'gallery':[99999999]},token,'PUT')[0]==400
 product['cover_id']=None;assert req(admin,'admin/products/'+str(product['id']),product,token,'PUT')[0]==200
 assert req(admin,'admin/media/'+str(media_id),{},token,'DELETE')[0]==409 # Revision history retains the image
 _,versions=req(admin,'admin/versions/products/'+str(product['id']));assert len(versions['data'])>=2
 assert req(editor,'admin/preview/products/'+str(product['id']))[0]==403
 previous=versions['data'][-1]
 assert req(admin,'admin/restore/'+str(previous['id']),{},token)[0]==200
 assert req(admin,'admin/preview/products/'+str(product['id']))[1]['data']['status']=='draft'
 assert req(client(),'products/smoke-private-product')[0]==200
 assert req(admin,'admin/products/'+str(product['id']),{**product,'body':'{"type":"doc","content":[{"type":"script"}]}'},token,'PUT')[0]==400
 product['status']='scheduled';product['publish_at']=(datetime.now(timezone.utc)+timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S');product['title']='Smoke scheduled product'
 assert req(admin,'admin/products/'+str(product['id']),product,token,'PUT')[0]==200
 assert req(client(),'products/smoke-private-product')[1]['data']['title']!='Smoke scheduled product'
 script.write_text("<?php $d=new SQLite3('/app/backend/writable/stable.sqlite');$d->exec(\"UPDATE products SET publish_at='2020-01-01 00:00:00' WHERE id="+str(product['id'])+"\");")
 subprocess.run(['docker','compose','exec','-T','api','php','writable/smoke-account.php'],cwd=root,check=True,capture_output=True);script.unlink()
 assert req(client(),'products/smoke-private-product')[1]['data']['title']=='Smoke scheduled product'
 pdf=b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'
 assert multipart(admin,'admin/datasheet/'+str(product['id']),{},'sheet.pdf',pdf,'application/pdf',token)[0]==200
 doc=req(admin,'admin/details/'+str(product['id']))[1]['data']['datasheet']['id']
 assert req(client(),'documents/'+str(doc))[0]==404
 assert req(admin,'admin/bulk/products',{'ids':[product['id']],'status':'published'},token)[0]==200
 with client().open('http://127.0.0.1:8080/api/v1/documents/'+str(doc)) as response:assert response.read().startswith(b'%PDF-')
 assert req(admin,'admin/navigation',[{'group_name':'header','href':'javascript:alert(1)','label':'Bad','visible':1}],token,'PUT')[0]==400
 assert req(editor,'admin/permissions')[0]==403
 assert req(editor,'admin/system')[0]==403
 assert req(admin,'admin/system')[1]['data']['gd'] is True
 csv=b'title,slug,description,body,status,category_id\nSmoke CSV,smoke-csv,Testing import,Test,published,1\n'
 assert multipart(admin,'admin/import/products',{},'products.csv',csv,'text/csv',token)[0]==200
 assert req(client(),'products/smoke-csv')[0]==404
 assert multipart(admin,'admin/import/products',{},'products.csv',csv,'text/csv',token)[0]==400
 job={'title':'Smoke job','slug':'smoke-job','description':'Test only','body':'Test only','status':'draft'}
 assert req(admin,'admin/careers',job,token)[0]==200
 _,jobs=req(admin,'admin/careers');job['id']=next(j['id'] for j in jobs['data'] if j['slug']=='smoke-job')
 application={'name':'Smoke applicant','email':'smoke-applicant@example.invalid','phone':'123456789','message':'Local smoke application','consent':'true'}
 assert multipart(client(),'apply/'+str(job['id']),application)[0]==404
 job['status']='published';assert req(admin,'admin/careers/'+str(job['id']),job,token,'PUT')[0]==200
 assert multipart(client(),'apply/'+str(job['id']),application)[0]==201
 _,applications=req(admin,'admin/applications');app_id=next(a['id'] for a in applications['data'] if a['email']=='smoke-applicant@example.invalid')
 assert req(editor,'admin/applications')[0]==403
 assert req(admin,'admin/applications/'+str(app_id),{},token,'DELETE')[0]==200
 if os.environ.get('RUN_BROWSER_TESTS')=='1':
  subprocess.run(['npx','playwright','test','tests/admin.spec.ts'],cwd=root/'frontend',env={**os.environ,'TEST_STAFF_PASSWORD':password},check=True)
 quote={'name':'Smoke quote','email':'smoke-quote@example.invalid','phone':'123456789','message':'Local test requirements','consent':True,'items':[{'id':product['id'],'quantity':2}]}
 pdf=b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'
 status,res=multipart(client(),'quotes',{'payload':json.dumps(quote)},'boq.pdf',pdf,'application/pdf','',file_field='attachment');assert status==201,(status,res)
 _,inquiries=req(admin,'admin/inquiries');quote_id=next(i['id'] for i in inquiries['data'] if i['email']=='smoke-quote@example.invalid')
 assert req(client(),'admin/boq/'+str(quote_id))[0]==403
 with admin.open('http://127.0.0.1:8080/api/v1/admin/boq/'+str(quote_id)) as response:assert response.read().startswith(b'%PDF-')
 assert req(admin,'auth/logout' ,{},token)[0]==200
 assert req(admin,'admin/products')[0]==403
 print('PASS: auth/RBAC, CSRF, CRUD, draft isolation, image validation/privacy/deletion protection, revisions, CSV import/duplicates, career applications, retention deletion, logout')
finally:
 cleanup=r"""<?php
 $d=new SQLite3('/app/backend/writable/stable.sqlite');
 $q=$d->query("SELECT attachment FROM inquiries WHERE email='smoke-quote@example.invalid'");
 while($r=$q->fetchArray(SQLITE3_ASSOC)){if($r['attachment'])@unlink('/app/backend/writable/boqs/'.$r['attachment']);}
 $d->exec("DELETE FROM notification_queue WHERE (event IN ('application','application_confirmation') AND record_id IN (SELECT id FROM applications WHERE email='smoke-applicant@example.invalid')) OR (event='quotes' AND record_id IN (SELECT id FROM inquiries WHERE email='smoke-quote@example.invalid')); DELETE FROM quote_items WHERE inquiry_id IN (SELECT id FROM inquiries WHERE email='smoke-quote@example.invalid'); DELETE FROM inquiries WHERE email='smoke-quote@example.invalid'; DELETE FROM applications WHERE email='smoke-applicant@example.invalid';");
 $q=$d->query("SELECT id,filename FROM documents WHERE id IN (SELECT datasheet_id FROM products WHERE slug LIKE 'smoke-%')");while($r=$q->fetchArray(SQLITE3_ASSOC)){@unlink('/app/backend/writable/documents/'.$r['filename']);$d->exec('DELETE FROM documents WHERE id='.(int)$r['id']);}
 foreach(['products'=>"slug LIKE 'smoke-%' OR slug='browser-smoke-draft'",'careers'=>"slug='smoke-job'"] as $module=>$where){
   foreach(['content_versions','content_publications','redirects','faqs'] as $table)$d->exec("DELETE FROM $table WHERE module='$module' AND record_id IN (SELECT id FROM $module WHERE $where)");
   if($module==='products')foreach(['product_images','product_specifications','product_variants'] as $table)$d->exec("DELETE FROM $table WHERE product_id IN (SELECT id FROM products WHERE $where)");
   $d->exec("DELETE FROM $module WHERE $where");
 }
 $q=$d->query("SELECT filename,thumbnail FROM media_files WHERE alt IN ('Smoke licensed image','Browser smoke image')");while($r=$q->fetchArray(SQLITE3_ASSOC)){foreach($r as $file)if($file)@unlink('/app/backend/writable/media/'.$file);}
 $d->exec("DELETE FROM media_files WHERE alt IN ('Smoke licensed image','Browser smoke image'); DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'smoke-%@example.invalid'); DELETE FROM users WHERE email LIKE 'smoke-%@example.invalid';");
 """
 script.write_text(cleanup);subprocess.run(['docker','compose','exec','-T','api','php','writable/smoke-account.php'],cwd=root,check=True,capture_output=True);script.unlink()
