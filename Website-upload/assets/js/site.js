(()=>{'use strict';
  const AR=document.documentElement.lang==='ar';
  const $=(q,root=document)=>root.querySelector(q),$$=(q,root=document)=>[...root.querySelectorAll(q)];
  const navButton=$('[data-nav-toggle]');
  if(navButton){const nav=$('#site-nav');navButton.addEventListener('click',()=>{let on=navButton.getAttribute('aria-expanded')!=='true';navButton.setAttribute('aria-expanded',String(on));nav.classList.toggle('is-open',on)});$$('a',nav).forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');navButton.setAttribute('aria-expanded','false')}));}
  const intro=$('[data-brand-intro]');let introTimers=[];
  function clearIntroTimers(){introTimers.forEach(clearTimeout);introTimers=[];}
  function hideIntro(){if(!intro)return;clearIntroTimers();intro.hidden=true;intro.className='ah-intro';document.body.classList.remove('intro-active');}
  function showIntro(){if(!intro)return;
     const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, phone=innerWidth<=760;
     const target=$('[data-brand-target]'); if(target){const r=target.getBoundingClientRect();intro.style.setProperty('--brand-dx',(r.left+r.width/2-innerWidth/2)+'px');intro.style.setProperty('--brand-dy',(r.top+r.height/2-innerHeight/2)+'px');}
     clearIntroTimers(); intro.hidden=false; intro.className='ah-intro';document.body.classList.add('intro-active');
     // Start only once the logo has loaded (max 1.5 s), so slow mobile data never shows an empty screen.
     const mark=$('.ah-intro-mark',intro);
     const ready=(mark&&!mark.complete)?new Promise(res=>{mark.addEventListener('load',res,{once:true});mark.addEventListener('error',res,{once:true});introTimers.push(setTimeout(res,1500));}):Promise.resolve();
     ready.then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
       if(intro.hidden)return;
       // reduced motion: fade in, hold, fade out (no movement). Phones hold a little longer.
       const t=reduce?{show:20,end:1900,hide:2450}:{show:30,shrink:phone?1500:1150,end:phone?2050:1650,hide:phone?2550:2100};
       introTimers.push(setTimeout(()=>intro.classList.add('is-revealed'),t.show));
       if(t.shrink)introTimers.push(setTimeout(()=>intro.classList.add('is-shrinking'),t.shrink));
       introTimers.push(setTimeout(()=>intro.classList.add('is-ending'),t.end));
       introTimers.push(setTimeout(hideIntro,t.hide));
     })));
  }
  if(intro){
    $('.intro-skip',intro)?.addEventListener('click',hideIntro);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!intro.hidden)hideIntro()});
    $$('[data-replay-logo]').forEach(b=>b.addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'});setTimeout(showIntro,250)}));
    // Play on arrival at the home page (new visit or reload); skip when moving between pages of this site.
    let internal=false;try{internal=!!document.referrer&&new URL(document.referrer).origin===location.origin&&performance.getEntriesByType('navigation')[0]?.type!=='reload'}catch(e){}
    if(!internal && document.body.dataset.autoIntro==='yes')showIntro();
  }
  // Change home-sector copy without loading the 72-row original register.
  const sectorBox=$('#sector-detail');
  if(sectorBox&&window.AH_SECTORS){
    const buttons=$$('[data-sector-id]');
    function choose(id){let v=window.AH_SECTORS.find(s=>s.id===id)||window.AH_SECTORS[0];buttons.forEach(b=>{const active=b.dataset.sectorId===v.id;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
      $('[data-sector-title]',sectorBox).textContent=v.label;$('[data-sector-copy]',sectorBox).textContent=v.detail;$('[data-sector-deliverables]',sectorBox).textContent=v.deliverables;$('[data-sector-example]',sectorBox).textContent=v.example;
    }
    buttons.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.sectorId)));choose('federal');
  }
  // Case-type register, supported sectors only. Exact legacy records stay accessible at the live site.
  const reg=$('#register-body');
  if(reg&&window.AH_SECTORS){
    const query=$('#project-search'),select=$('#project-sector'),count=$('#project-count');
    function update(){let q=(query?.value||'').toLowerCase().trim();let filt=select?.value||'all';reg.replaceChildren();let sectors=window.AH_SECTORS.filter(s=>(filt==='all'||s.id===filt)&&[s.label,s.scope,s.deliverables,s.example,s.detail].some(t=>t.toLowerCase().includes(q)));
      sectors.forEach((s,i)=>{let tr=document.createElement('tr');[s.label,s.example,s.deliverables].forEach(txt=>{let td=document.createElement('td');td.textContent=txt;tr.append(td)});reg.append(tr)});
      if(!sectors.length){let tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=3;td.textContent='No matching sector summary. Try another search or use the full original project register.';tr.append(td);reg.append(tr)}count.textContent=sectors.length+' sector summaries shown';}
    query?.addEventListener('input',update);select?.addEventListener('change',update);update();
  }
  // Report gallery with working type filters.
  const gallery=$('#report-gallery');
  if(gallery&&window.AH_REPORTS){const buttons=$$('[data-kind]'),count=$('#report-count');let selected='All';
    function card(item){let a=document.createElement('article');a.className='sample-card';a.dataset.kind=item.kind;
     let t=document.createElement('div');t.className='sample-thumb';let img=document.createElement('img');img.src=item.thumb;img.alt=(AR?'معاينة تقرير ':'Preview of ')+item.title+(AR?'':' report');img.loading='lazy';t.append(img);
     let body=document.createElement('div');body.className='sample-body';let micro=document.createElement('span');micro.className='eyebrow';micro.textContent=(item.kindLabel||item.kind)+' / '+item.sector;let h=document.createElement('h3');h.textContent=item.title;let p=document.createElement('p');p.textContent=item.desc;
     let l=document.createElement('a');l.className='link-arrow';l.href=item.href;l.target='_blank';l.rel='noopener';l.textContent=AR?'افتح ملف PDF':'View PDF';l.setAttribute('aria-label',(AR?'افتح ملف ':'Open ')+item.title+' PDF');body.append(micro,h,p,l);a.append(t,body);return a;}
    function render(){buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===selected)));let reports=window.AH_REPORTS.filter(r=>selected==='All'||r.kind===selected);gallery.replaceChildren(...reports.map(card));const lab=(buttons.find(b=>b.dataset.kind===selected)||{}).textContent||selected;count.textContent=AR?(reports.length+(reports.length===1?' تقرير':' تقارير')+(selected==='All'?' في المكتبة':' · '+lab)):(reports.length+(reports.length===1?' report':' reports')+(selected==='All'?' in the library':' · '+lab));}
    buttons.forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.kind;render()}));render();
  }
  // Site photos: static manifest, and temporary local-only browser preview (never uploaded).
  const photoGallery=$('#approved-gallery');
  if(photoGallery){const photos=window.AH_APPROVED_PHOTOS||[];const empty=$('#approved-empty');empty.hidden=photos.length>0;
    photos.forEach(photo=>{if(!photo.src||!photo.alt)return;let fig=document.createElement('figure');fig.className='photo-card';let btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-label','Open '+photo.title);let img=document.createElement('img');img.src=photo.src;img.alt=photo.alt;img.loading='lazy';btn.append(img);let caption=document.createElement('figcaption');let heading=document.createElement('b');heading.textContent=photo.title;let meta=document.createElement('span');meta.textContent=[photo.project,photo.date].filter(Boolean).join(' / ');caption.append(heading,meta);fig.append(btn,caption);photoGallery.append(fig);btn.addEventListener('click',()=>openPhoto(photo.src,photo.alt,photo.title));});
    const modal=$('#photo-lightbox');function openPhoto(src,alt,title){let im=$('img',modal);im.src=src;im.alt=alt;$('p',modal).textContent=title;modal.showModal();}$('#close-photo-modal')?.addEventListener('click',()=>modal.close());modal?.addEventListener('click',e=>{if(e.target===modal)modal.close()});
    const fileInput=$('#local-photos');const previews=$('#photo-previews'),status=$('#photo-preview-status');let objectUrls=[];
    fileInput?.addEventListener('change',()=>{objectUrls.forEach(URL.revokeObjectURL);objectUrls=[];previews.replaceChildren();let files=[...(fileInput.files||[])].slice(0,12);let accepted=0;files.forEach(file=>{if(!file.type.startsWith('image/')||file.size>8e6)return;let url=URL.createObjectURL(file);objectUrls.push(url);let item=document.createElement('div');item.className='preview-item';let img=document.createElement('img');img.src=url;img.alt='Local preview of '+file.name;let label=document.createElement('span');label.textContent=file.name;item.append(img,label);previews.append(item);accepted++});status.textContent=accepted?accepted+' local previews displayed. Nothing has been uploaded or published.':'Select JPEG, PNG, or WebP images up to 8 MB each.';});
    window.addEventListener('pagehide',()=>objectUrls.forEach(URL.revokeObjectURL));
  }
  // Enquiry form: posts to a Google Apps Script web app that adds a row to the enquiries Sheet and emails Ahmed.
  const inquiry=$('#inquiry-form');
  if(inquiry){
    const ENDPOINT='https://script.google.com/macros/s/AKfycbzjxDHgw2Wicbu4JVkv7Io270uuGsqmeLTeQxedcAGLshQjj8VNw-nJoTGtu3r1eLzO/exec';
    const status=$('#form-status'),btn=$('button[type=submit]',inquiry);
    const say=(msg,ok)=>{status.textContent=msg;status.className='form-status '+(ok?'is-ok':'is-err');};
    inquiry.addEventListener('submit',async e=>{e.preventDefault();
      const d=new FormData(inquiry);
      if((d.get('website')||'').trim()){say(AR?'شكراً لك، تم إرسال استفسارك.':'Thank you. Your enquiry has been sent.',true);inquiry.reset();return;}
      const name=(d.get('name')||'').trim(),email=(d.get('email')||'').trim(),details=(d.get('details')||'').trim();
      if(!name||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!details){say(AR?'يرجى إدخال الاسم وبريد إلكتروني صحيح ووصف موجز.':'Please add your name, a valid email and a short description.',false);return;}
      const body=new URLSearchParams({name,email,project:(d.get('project')||'').trim(),service:d.get('service')||'',details,page:location.pathname});
      const btnLabel=btn.textContent;btn.disabled=true;btn.textContent=AR?'جارٍ الإرسال...':'Sending...';
      try{await fetch(ENDPOINT,{method:'POST',mode:'no-cors',body});
        say(AR?('شكراً لك يا '+name.split(' ')[0]+'، تم إرسال استفسارك وسأرد عليك بالبريد الإلكتروني خلال يوم عمل واحد.'):('Thank you, '+name.split(' ')[0]+'. Your enquiry has been sent and I will reply by email within one working day.'),true);inquiry.reset();}
      catch(err){say(AR?'تعذّر إرسال النموذج. يرجى المراسلة على ahmed.hs.abdulhamid@gmail.com أو عبر واتساب.':'The form could not be sent. Please email ahmed.hs.abdulhamid@gmail.com or use WhatsApp.',false);}
      finally{btn.disabled=false;btn.textContent=btnLabel;}
    });
  }
})();
