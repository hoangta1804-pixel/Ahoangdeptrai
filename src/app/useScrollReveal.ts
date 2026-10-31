import {useEffect} from 'react';

/** Các khối hiện dần khi cuộn tới. Thêm selector ở đây để áp dụng cho khối mới. */
const SELECTOR=[
  '.shop-section-heading','.shop-centered-heading','.shop-product-card','.shop-region-card','.shop-promise-card',
  '.shop-review-card','.shop-story-card','.shop-farmer-image','.shop-about-copy','.shop-catalog-footer','.shop-footer-grid>div',
  '.admin-card','.reveal',
].join(',');

/**
 * Hiệu ứng xuất hiện khi cuộn: phần tử khớp SELECTOR được gắn `reveal-init`, khi vào màn hình thì thêm `is-visible`.
 * Phần tử cùng hàng được lệch thời gian nhẹ (stagger). Không chạy khi người dùng chọn giảm chuyển động hoặc trình duyệt tự động (test).
 */
export function useScrollReveal(){
  useEffect(()=>{
    if(typeof IntersectionObserver==='undefined'||navigator.webdriver)return;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const seen=new WeakSet<Element>();
    const io=new IntersectionObserver(entries=>{
      let order=0;
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        const el=entry.target as HTMLElement;
        el.style.setProperty('--reveal-delay',`${Math.min(order++,6)*70}ms`);
        el.classList.add('is-visible');io.unobserve(el);
      }
    },{rootMargin:'0px 0px -8% 0px',threshold:0.08});
    const scan=(root:ParentNode)=>{
      const found=root instanceof Element&&root.matches(SELECTOR)?[root,...root.querySelectorAll(SELECTOR)]:[...root.querySelectorAll(SELECTOR)];
      for(const el of found){
        if(seen.has(el)||el.closest('.app-sheet'))continue;
        seen.add(el);el.classList.add('reveal-init');io.observe(el);
      }
    };
    scan(document.body);
    let queued=false;
    const mo=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan(document.body);});});
    mo.observe(document.body,{childList:true,subtree:true});
    return()=>{io.disconnect();mo.disconnect();};
  },[]);
}
