
/* ============================================================
   AURA COFFEE — Interaction Layer
   ============================================================ */

/* ---------- Scroll progress + nav scroll state ---------- */
const progressBar = document.getElementById('scroll-progress');
const nav = document.getElementById('nav');
function onScroll(){
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  progressBar.style.width = scrolled + '%';
  nav.classList.toggle('scrolled', h.scrollTop > 40);
}
document.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ---------- Mobile nav ---------- */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger?.addEventListener('click', ()=>{
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  hamburger.classList.toggle('active', open);
});
navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
  navLinks.classList.remove('open'); hamburger.setAttribute('aria-expanded', false);
}));

/* ---------- Reveal on scroll ---------- */
const revealEls = document.querySelectorAll('.reveal, .reveal-scale');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, {threshold:.15, rootMargin:'0px 0px -60px 0px'});
revealEls.forEach(el=>io.observe(el));

/* ---------- Hero title text reveal ---------- */
requestAnimationFrame(()=> setTimeout(()=> document.getElementById('heroTitle').classList.add('play'), 150));

/* ---------- Steam wisps ---------- */
const steamWrap = document.getElementById('steamWrap');
for(let i=0;i<4;i++){
  const w = document.createElement('div');
  w.className='steam-wisp';
  w.style.left = (i*10-15)+'px';
  w.style.animationDelay = (i*1.1)+'s';
  steamWrap.appendChild(w);
}

/* ---------- Magnetic buttons ---------- */
document.querySelectorAll('.magnetic').forEach(btn=>{
  btn.addEventListener('mousemove', e=>{
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    btn.style.transform = `translate(${x*0.28}px, ${y*0.5}px)`;
  });
  btn.addEventListener('mouseleave', ()=>{ btn.style.transform=''; });
});

/* ---------- Stat counters ---------- */
const statEls = document.querySelectorAll('.stat-num');
const statIo = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(!e.isIntersecting) return;
    statIo.unobserve(e.target);
    const el = e.target;
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isFloat = target % 1 !== 0;
    let cur = 0;
    const dur = 1600, start = performance.now();
    function tick(now){
      const p = Math.min((now-start)/dur, 1);
      const eased = 1 - Math.pow(1-p, 3);
      cur = target * eased;
      el.textContent = (isFloat ? cur.toFixed(1) : Math.round(cur)) + suffix;
      if(p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}, {threshold:.5});
statEls.forEach(el=>statIo.observe(el));

/* ---------- Menu filters ---------- */
const filterBtns = document.querySelectorAll('.filter-btn');
const menuItems = document.querySelectorAll('.menu-item');
filterBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    filterBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    menuItems.forEach(item=>{
      const match = cat==='all' || item.dataset.cat===cat;
      item.classList.toggle('show', match);
    });
  });
});
document.querySelectorAll('.menu-add-btn').forEach(b=>{
  b.addEventListener('click', ()=>{ b.textContent='✓'; setTimeout(()=>b.textContent='+', 900); });
});
document.querySelectorAll('.card-add').forEach(b=>{
  b.addEventListener('click', ()=>{ const t=b.textContent; b.textContent='Added ✓'; setTimeout(()=>b.textContent=t, 1200); });
});

/* ---------- Testimonial carousel ---------- */
(function () {
  const wrap = document.querySelector('.review-track-wrap');
  const track = document.getElementById('reviewTrack');
  const prevBtn = document.getElementById('revPrev');
  const nextBtn = document.getElementById('revNext');
  const cards = Array.from(track.children);
  let index = 0;

  function step() {
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  }

  function visibleCount() {
    return Math.max(1, Math.floor(wrap.getBoundingClientRect().width / step()));
  }

  function maxIndex() {
    return Math.max(0, cards.length - visibleCount());
  }

  function update() {
    index = Math.min(index, maxIndex());
    track.style.transform = `translateX(-${index * step()}px)`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index >= maxIndex();
  }

  nextBtn.addEventListener('click', () => { index++; update(); });
  prevBtn.addEventListener('click', () => { index--; update(); });
  window.addEventListener('resize', update);

  update();
})();


/* ---------- Parallax interior ---------- */
const parLayer1 = document.getElementById('parLayer1');
const parLayer2 = document.getElementById('parLayer2');
const experience = document.getElementById('experience');
document.addEventListener('scroll', ()=>{
  const rect = experience.getBoundingClientRect();
  const vh = window.innerHeight;
  if(rect.bottom < 0 || rect.top > vh) return;
  const progress = (vh - rect.top) / (vh + rect.height);
  parLayer1.style.transform = `translateY(${(progress-0.5)*40}px)`;
  parLayer2.style.transform = `translateY(${(progress-0.5)*90}px)`;
}, {passive:true});



/* ============================================================
   THREE.JS — Hero coffee cup + floating beans
   ============================================================ */
(function heroScene(){
  const canvas = document.getElementById('hero-canvas');
  const stage = canvas.parentElement;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 1.1, 7.2);
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

  function resize(){
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  // Lighting
  scene.add(new THREE.AmbientLight(0x8a6a4a, .7));
  const key = new THREE.PointLight(0xe0c168, 2.4, 20); key.position.set(3,4,4); scene.add(key);
  const rim = new THREE.PointLight(0xb8733e, 1.6, 20); rim.position.set(-4,-1,-3); scene.add(rim);
  const fill = new THREE.PointLight(0xffffff, .5, 20); fill.position.set(0,2,5); scene.add(fill);

  // Coffee cup via LatheGeometry
  const cupGroup = new THREE.Group();
  const pts = [];
  pts.push(new THREE.Vector2(0,0));
  pts.push(new THREE.Vector2(0.78,0));
  pts.push(new THREE.Vector2(0.86,0.05));
  pts.push(new THREE.Vector2(0.9,0.5));
  pts.push(new THREE.Vector2(0.98,1.55));
  pts.push(new THREE.Vector2(1.0,1.62));
  const cupGeo = new THREE.LatheGeometry(pts, 48);
  const cupMat = new THREE.MeshStandardMaterial({color:0xf2e6d8, roughness:.35, metalness:.05});
  const cupMesh = new THREE.Mesh(cupGeo, cupMat);
  cupGroup.add(cupMesh);

  // Coffee liquid disc
  const liquidGeo = new THREE.CircleGeometry(0.94, 48);
  const liquidMat = new THREE.MeshStandardMaterial({color:0x3d2418, roughness:.25, metalness:.15});
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.rotation.x = -Math.PI/2; liquid.position.y = 1.56;
  cupGroup.add(liquid);

  // Handle (torus)
  const handleGeo = new THREE.TorusGeometry(0.42, 0.09, 16, 32, Math.PI*1.3);
  const handleMat = cupMat;
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(0.98, 0.9, 0);
  handle.rotation.z = Math.PI/2 + 0.35;
  handle.rotation.y = 0.1;
  cupGroup.add(handle);

  // Saucer
  const saucerGeo = new THREE.CylinderGeometry(1.5,1.55,0.12,48);
  const saucer = new THREE.Mesh(saucerGeo, cupMat);
  saucer.position.y = -0.06;
  cupGroup.add(saucer);

  cupGroup.scale.setScalar(1.05);
  cupGroup.position.set(0.3,-1.3,0);
  scene.add(cupGroup);

  // Floating coffee beans
  function makeBean(){
    const g = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(0.26, 20, 20);
    sphereGeo.scale(1,0.72,0.55);
    const mat = new THREE.MeshStandardMaterial({color:0x3d2418, roughness:.55, metalness:.05});
    const body = new THREE.Mesh(sphereGeo, mat);
    g.add(body);
    const creaseGeo = new THREE.BoxGeometry(0.03,0.34,0.05);
    const creaseMat = new THREE.MeshStandardMaterial({color:0x1c120b, roughness:.6});
    const crease = new THREE.Mesh(creaseGeo, creaseMat);
    crease.position.z = 0.16;
    g.add(crease);
    return g;
  }
  const beans = [];
  const beanPositions = [
    [-2.4,1.6,0.6],[2.6,2.1,-0.5],[-1.8,-0.4,1.2],[2.2,-1.6,0.4],[0.2,2.6,-0.8],[-2.8,-1.4,-0.3]
  ];
  beanPositions.forEach((p,i)=>{
    const b = makeBean();
    b.position.set(...p);
    b.rotation.set(Math.random()*6, Math.random()*6, Math.random()*6);
    b.userData.speed = 0.4 + Math.random()*0.5;
    b.userData.offset = Math.random()*Math.PI*2;
    b.userData.baseY = p[1];
    scene.add(b);
    beans.push(b);
  });

  let mouseX = 0, mouseY = 0, targetRotY = 0, targetRotX = 0;
  stage.addEventListener('mousemove', (e)=>{
    const r = stage.getBoundingClientRect();
    mouseX = ((e.clientX - r.left)/r.width - 0.5) * 2;
    mouseY = ((e.clientY - r.top)/r.height - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    targetRotY += (mouseX*0.35 - targetRotY)*0.04;
    targetRotX += (-mouseY*0.15 - targetRotX)*0.04;
    cupGroup.rotation.y = targetRotY + Math.sin(t*0.15)*0.05;
    cupGroup.rotation.x = targetRotX;
    beans.forEach(b=>{
      b.position.y = b.userData.baseY + Math.sin(t*b.userData.speed + b.userData.offset)*0.28;
      b.rotation.x += 0.004; b.rotation.y += 0.006;
      b.position.x += (mouseX*0.15)*0.01;
    });
    key.position.x = 3 + Math.sin(t*0.3)*0.6;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ============================================================
   THREE.JS — Process section rotating bean
   ============================================================ */
(function processScene(){
  const canvas = document.getElementById('process-canvas');
  const stage = canvas.parentElement;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0,0,6.5);
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

  function resize(){
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  scene.add(new THREE.AmbientLight(0x6a4c34, .8));
  const key = new THREE.PointLight(0xe0c168, 3, 20); key.position.set(4,3,4); scene.add(key);
  const rim = new THREE.PointLight(0xb8733e, 2, 20); rim.position.set(-4,-2,-3); scene.add(rim);

  const beanGroup = new THREE.Group();
  const bodyGeo = new THREE.SphereGeometry(1.6, 48, 48);
  bodyGeo.scale(1,0.78,0.62);
  const bodyMat = new THREE.MeshStandardMaterial({color:0x5a3826, roughness:.5, metalness:.08});
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  beanGroup.add(body);

  const creaseCurvePts = [];
  for(let i=0;i<=20;i++){
    const a = (i/20-0.5)*2.6;
    creaseCurvePts.push(new THREE.Vector3(0, a, 1.0 - Math.pow(a/1.4,2)*0.35));
  }
  const creaseCurve = new THREE.CatmullRomCurve3(creaseCurvePts);
  const creaseTube = new THREE.TubeGeometry(creaseCurve, 40, 0.055, 8, false);
  const creaseMat = new THREE.MeshStandardMaterial({color:0x1c120b, roughness:.6});
  const crease = new THREE.Mesh(creaseTube, creaseMat);
  beanGroup.add(crease);

  scene.add(beanGroup);

  const clock = new THREE.Clock();
  let visible = true;
  const vis = new IntersectionObserver(es=>es.forEach(e=>visible=e.isIntersecting), {threshold:.05});
  vis.observe(stage);

  function animate(){
    requestAnimationFrame(animate);
    if(!visible) return;
    const t = clock.getElapsedTime();
    beanGroup.rotation.y = t*0.35;
    beanGroup.rotation.x = Math.sin(t*0.2)*0.15;
    key.position.x = 4*Math.cos(t*0.2);
    renderer.render(scene, camera);
  }
  animate();
  const commentForm = document.getElementById('commentForm');
if (commentForm) {
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('commentStatus');
    const name = commentForm.name.value.trim();
    const message = commentForm.message.value.trim();
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message })
      });
      if (!res.ok) throw new Error();
      commentForm.reset();
      status.textContent = 'Thank you for your comment!';
    } catch {
      status.textContent = 'Could not send. Please try again.';
    }
  });
}
  
})();

