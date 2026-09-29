(()=>{
 const hub=document.getElementById('themeHub'),app=document.getElementById('rebirthApp');
 function showTheme(){hub.classList.remove('theme-app-hidden');app.classList.add('theme-app-hidden');document.body.classList.remove('rebirth-theme-active');document.title='차원 환승 센터';history.replaceState(null,'',location.pathname);window.scrollTo({top:0,behavior:'instant'})}
 function openRebirth(){hub.classList.add('theme-app-hidden');app.classList.remove('theme-app-hidden');document.body.classList.add('rebirth-theme-active');document.title='몽글몽글 환생 룰렛';history.replaceState(null,'',`${location.pathname}?theme=reincarnation`);window.scrollTo({top:0,behavior:'instant'})}
 document.getElementById('selectRebirthTheme').addEventListener('click',openRebirth);
 if(new URLSearchParams(location.search).get('theme')==='reincarnation')openRebirth();else showTheme();
})();
