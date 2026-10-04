// Presentation bridge for the admitted, trusted first-party frame. No game
// data, progress, collections or storage APIs are read or changed here.
export function attachFramePresentation(frame,{getTheme,onLanguage,onFilters}) {
  const doc=frame.contentDocument;
  if(!doc || doc.documentElement.dataset.wrnWebsiteHost) return ()=>{};
  const root=doc.documentElement;root.dataset.wrnWebsiteHost='full-screen';
  const link=doc.createElement('link');link.rel='stylesheet';link.href='/atlas/atlas-frame.css';link.addEventListener('load',()=>frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('resize')));doc.head.append(link);
  const selector=doc.getElementById('language-select');
  function refresh(){
    root.dataset.wrnHostTheme=getTheme();
    onFilters(doc.getElementById('control-panel')?.classList.contains('is-open')===true);
  }
  const observer=new MutationObserver(refresh);
  observer.observe(root,{attributes:true,attributeFilter:['data-theme']});
  const panel=doc.getElementById('control-panel');if(panel)observer.observe(panel,{attributes:true,attributeFilter:['class']});
  const language=()=>onLanguage(selector.value);
  selector?.addEventListener('change',language);
  refresh();
  return {refresh,toggleFilters(){
    if(panel.classList.contains('is-open')) doc.getElementById('menu-close').click();
    else doc.getElementById('menu-toggle').click();
  },destroy(){observer.disconnect();selector?.removeEventListener('change',language);}};
}
