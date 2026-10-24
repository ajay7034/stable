import {test,expect} from '@playwright/test';
const pagesUrl=process.env.PAGES_TEST_URL||'http://127.0.0.1:4173/stable/';
test.skip(!process.env.PAGES_TEST_URL,'Run with PAGES_TEST_URL against the generated static site.');
test.use({baseURL:pagesUrl});
test('GitHub Pages public routes and assets work under the repository prefix',async({page})=>{
 const failures:string[]=[];page.on('pageerror',e=>failures.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.url()+': '+r.status())});
 for(const route of ['','about/','products/','products/category/hardware/','blogs/','blogs/planning-a-material-list/','careers/','contact/','request-quote/']){
  const response=await page.goto(pagesUrl+route);expect(response?.status()).toBe(200);await page.waitForLoadState('networkidle');await expect(page.locator('main h1').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 }
 expect(failures).toEqual([]);
});
test('GitHub Pages mobile navigation, search and enquiry validation',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(pagesUrl);await page.getByRole('button',{name:'Open menu'}).click();await expect(page.getByRole('dialog',{name:'Explore Stable'})).toBeVisible();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Search materials'}).click();await page.getByRole('searchbox',{name:'Search materials',exact:true}).fill('tiles');await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.locator('#static-filter-status')).toHaveText('1 matching results');await expect(page.locator('.category-card:visible')).toHaveCount(1);await expect(page.locator('.category-card:visible')).toContainText('Ceramics');
 await page.goto(pagesUrl+'contact/');await expect(page.getByRole('button',{name:'Compose email enquiry'})).toBeVisible();expect(await page.locator('form.inquiry').evaluate((f:HTMLFormElement)=>f.reportValidity())).toBeFalsy();await expect(page.locator('input[type=file]')).toHaveCount(0);await expect(page.getByRole('status')).toContainText('opens your email app');
});
