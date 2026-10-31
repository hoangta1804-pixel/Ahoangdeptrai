import {useEffect,useState} from 'react';
import {Sprout} from 'lucide-react';

const SEEN='dac-san-so-lao-cai:intro-seen';
const DURATION=2900;

/** Intro khi mở web: hiện một lần mỗi phiên trình duyệt, bấm để bỏ qua. Tắt cho trình duyệt tự động (test) và người chọn giảm chuyển động. */
function shouldShow(){
  try{
    if(navigator.webdriver)return false;
    if(new URLSearchParams(window.location.search).has('setup'))return false;
    if(sessionStorage.getItem(SEEN))return false;
  }catch{/* sessionStorage có thể bị chặn: vẫn hiện intro. */}
  return true;
}

export function IntroSplash(){
  const [phase,setPhase]=useState<'show'|'leave'|'done'>(()=>shouldShow()?'show':'done');
  useEffect(()=>{
    if(phase!=='show')return;
    try{sessionStorage.setItem(SEEN,'1');}catch{/* bỏ qua */}
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer=setTimeout(()=>setPhase('leave'),reduced?600:DURATION);
    const prev=document.body.style.overflow;document.body.style.overflow='hidden';
    return()=>{clearTimeout(timer);document.body.style.overflow=prev;};
  },[phase]);
  useEffect(()=>{
    if(phase!=='leave')return;
    const timer=setTimeout(()=>setPhase('done'),700);
    return()=>clearTimeout(timer);
  },[phase]);
  if(phase==='done')return null;
  const skip=()=>setPhase('leave');
  return <div className={`intro-splash ${phase==='leave'?'is-leaving':''}`} role="presentation" onClick={skip}>
    <div className="intro-bg" aria-hidden="true"><span className="intro-orb intro-orb-1"/><span className="intro-orb intro-orb-2"/><span className="intro-orb intro-orb-3"/></div>
    <div className="intro-center">
      <span className="intro-mark" aria-hidden="true"><svg className="intro-ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54"/></svg><Sprout size={46} strokeWidth={1.5}/></span>
      <h1 className="intro-title" aria-label="Đặc Sản Số">{'Đặc Sản Số'.split('').map((ch,i)=><span key={i} style={{animationDelay:`${0.55+i*0.06}s`}}>{ch===' '?' ':ch}</span>)}</h1>
      <p className="intro-caption">TỪ MIỀN ĐẤT LÀNH · LÀO CAI</p>
      <span className="intro-progress" aria-hidden="true"><span/></span>
    </div>
    <button type="button" className="intro-skip" onClick={e=>{e.stopPropagation();skip();}}>Bỏ qua</button>
  </div>;
}
