export const PROFESSIONAL_ENVIRONMENTS: Record<string,string> = { legal_dept:'Departamento jurídico',law_firm:'Escritório de advocacia',public_sector:'Setor público',freelance:'Autônomo ou consultoria',other:'Outro' }
export type DirectoryMember = { user_id:string; display_name:string; current_role:string|null; public_headline:string|null; public_bio:string|null; organization_name:string|null; avatar_path:string|null; areas_of_expertise:string[]|null; directory_country:string|null; directory_region:string|null; directory_city:string|null; directory_qualifications:string[]; professional_type:string|null; profile_verification_status:string }
export type DirectoryResult = { members:DirectoryMember[];total:number;page:number;pageSize:number;facets:{countries:string[];regions:string[];cities:string[];expertise:string[];qualifications:string[]} }
export function directoryFilters(input:Record<string,string|string[]|undefined> = {}) {
  const text = (key:string,max=120) => typeof input[key] === 'string' ? input[key].trim().slice(0,max) : ''
  const rawPage=Number(text('page')); const type=text('type');const verification=text('verification');
  return { q:text('q',200),scope:text('scope')==='contacts'?'contacts':'',country:/^[A-Z]{2}$/.test(text('country'))?text('country'):'',region:text('region'),city:text('city'),type:Object.hasOwn(PROFESSIONAL_ENVIRONMENTS,type)?type:'',expertise:text('expertise'),qualification:text('qualification',160),verification:['verified','unverified'].includes(verification)?verification:'',sort:text('sort')==='recent'?'recent':'name',page:Number.isSafeInteger(rawPage)&&rawPage>0?Math.min(10000,rawPage):1 }
}
export function directoryUrl(filters:ReturnType<typeof directoryFilters>,changes:Partial<ReturnType<typeof directoryFilters>>={}) {
  const values={...filters,...changes};const query=new URLSearchParams();
  for(const [key,value] of Object.entries(values)) if(value && !(key==='page'&&value===1) && !(key==='sort'&&value==='name')) query.set(key,String(value))
  return `/community/members${query.size?'?'+query:''}`
}
