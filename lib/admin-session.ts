const KEY='menudeo_admin_session_v1';
const DURATION_MS=30*24*60*60*1000;
export function getAdminToken():string {
 if(typeof window==='undefined')return '';
 try {const raw=localStorage.getItem(KEY);if(!raw)return '';const session=JSON.parse(raw) as {token?:string;expiresAt?:number};if(typeof session.token==='string'&&session.token&&typeof session.expiresAt==='number'&&session.expiresAt>Date.now())return session.token;}catch{}
 localStorage.removeItem(KEY);sessionStorage.removeItem('menudeo_admin_token');return '';
}
export function saveAdminToken(token:string):void {
 if(typeof window==='undefined')return;
 localStorage.setItem(KEY,JSON.stringify({token,expiresAt:Date.now()+DURATION_MS}));
 sessionStorage.removeItem('menudeo_admin_token');
}

export function clearAdminToken():void {if(typeof window==='undefined')return;localStorage.removeItem(KEY);sessionStorage.removeItem('menudeo_admin_token');}
