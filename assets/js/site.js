(()=>{'use strict';
  const $=(q,root=document)=>root.querySelector(q),$$=(q,root=document)=>[...root.querySelectorAll(q)];
  const navButton=$('[data-nav-toggle]');
  if(navButton){const nav=$('#site-nav');navButton.addEventListener('click',()=>{let on=navButton.getAttribute('aria-expanded')!=='true';navButton.setAttribute('aria-expanded',String(on));nav.classList.toggle('is-open',on)});$$('a',nav).forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');navButton.setAttribute('aria-expanded','false')}));}
  const intro=$('[data-brand-intro]');let introTimers=[];
  function clearIntroTimers(){introTimers.forEach(clearTimeout);introTimers=[];}
  function hideIntro(){if(!intro)return;clearIntroTimers();intro.hidden=true;intro.className='ah-intro';document.body.classList.remove('intro-active');}
  function showIntro(){if(!intro||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
     const target=$('[data-brand-target]'); if(target){const r=target.getBoundingClientRect();intro.style.setProperty('--brand-dx',(r.left+r.width/2-innerWidth/2)+'px');intro.style.setProperty('--brand-dy',(r.top+r.height/2-innerHeight/2)+'px');}
     clearIntroTimers(); intro.hidden=false; intro.className='ah-intro';document.body.classList.add('intro-active');
     introTimers.push(setTimeout(()=>intro.classList.add('is-revealed'),80));
     introTimers.push(setTimeout(()=>intro.classList.add('is-shrinking'),1150));
     introTimers.push(setTimeout(()=>intro.classList.add('is-ending'),1650));
     introTimers.push(setTimeout(hideIntro,2100));
  }
  if(intro){
    $('.intro-skip',intro)?.addEventListener('click',hideIntro);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!intro.hidden)hideIntro()});
    $$('[data-replay-logo]').forEach(b=>b.addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'});setTimeout(showIntro,250)}));
    let already=false;try{already=sessionStorage.getItem('ahMonolithLogoIntroV2')==='1';sessionStorage.setItem('ahMonolithLogoIntroV2','1')}catch(e){}
    if(!already && document.body.dataset.autoIntro==='yes')showIntro();
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
     let t=document.createElement('div');t.className='sample-thumb';let img=document.createElement('img');img.src=item.thumb;img.alt='Preview of '+item.title+' report';img.loading='lazy';t.append(img);
     let body=document.createElement('div');body.className='sample-body';let micro=document.createElement('span');micro.className='eyebrow';micro.textContent=item.kind+' / '+item.sector;let h=document.createElement('h3');h.textContent=item.title;let p=document.createElement('p');p.textContent=item.desc;
     let l=document.createElement('a');l.className='link-arrow';l.href=item.href;l.target='_blank';l.rel='noopener';l.textContent='View PDF  ↗';l.setAttribute('aria-label','Open '+item.title+' PDF');body.append(micro,h,p,l);a.append(t,body);return a;}
    function render(){buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===selected)));let reports=window.AH_REPORTS.filter(r=>selected==='All'||r.kind===selected);gallery.replaceChildren(...reports.map(card));count.textContent=reports.length+(reports.length===1?' report':' reports')+(selected==='All'?' in the library':' · '+selected);}
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
  // Static site inquiry: prepares an email; does not submit files or send automatically.
  const inquiry=$('#inquiry-form');
  if(inquiry){inquiry.addEventListener('submit',e=>{e.preventDefault();let form=new FormData(inquiry);let subject='Project controls inquiry - '+(form.get('service')||'Scheduling');let lines=['Project / location: '+(form.get('project')||'Not specified'),'Requested service: '+(form.get('service')||''),'Brief: '+(form.get('details')||''),'Reply to: '+(form.get('email')||'')];location.href='mailto:ahmed.hs.abdulhamid@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(lines.join('\n\n'))});}
})();
