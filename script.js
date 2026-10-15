const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mobile navigation
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

// Subtle cursor light on pointer devices
if (matchMedia('(pointer:fine)').matches && !reduceMotion) {
  const glow = document.querySelector('.cursor-glow');
  window.addEventListener('pointermove', e => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  }, {passive:true});
} else {
  document.querySelector('.cursor-glow')?.remove();
}

// Scroll reveals; content remains visible if IntersectionObserver is unavailable.
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.12});
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

// 3D hero: a procedural, mechanical-inspired object. A CSS-only styled fallback
// remains visible if WebGL/CDN is unavailable.
async function initHero3D() {
  const canvas = document.querySelector('#hero-canvas');
  const host = canvas?.parentElement;
  if (!canvas || !host || reduceMotion) {
    if (canvas) canvas.style.display = 'none';
    return;
  }
  try {
    const THREE = await import('three');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 8);
    const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene.add(new THREE.AmbientLight(0xc6f2a0, 1.7));
    const key = new THREE.PointLight(0xd4ff9a, 48, 20); key.position.set(3, 3, 5); scene.add(key);
    const rim = new THREE.PointLight(0x648fcb, 25, 18); rim.position.set(-4, -2, 2); scene.add(rim);

    const assembly = new THREE.Group(); scene.add(assembly);
    const metal = new THREE.MeshStandardMaterial({color:0x84937b, metalness:.86, roughness:.24});
    const darkMetal = new THREE.MeshStandardMaterial({color:0x202b24, metalness:.9, roughness:.28});
    const accent = new THREE.MeshStandardMaterial({color:0xc8f169, metalness:.72, roughness:.22, emissive:0x263d0a, emissiveIntensity:.45});
    const glass = new THREE.MeshPhysicalMaterial({color:0x9bc8a1, metalness:.35, roughness:.14, transparent:true, opacity:.55, transmission:.2});
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 2), glass);
    assembly.add(core);
    const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(.68, 1), accent);
    assembly.add(inner);

    // Concentric precision rings and radial pins create an engineered, exploded-assembly feel.
    const ringSpecs = [
      {r:1.62,t:.035,rot:[0,0,0],mat:metal},
      {r:1.88,t:.018,rot:[Math.PI/2,.2,0],mat:accent},
      {r:1.43,t:.025,rot:[.65,.4,.55],mat:darkMetal},
      {r:1.72,t:.018,rot:[.3,1.0,.4],mat:metal}
    ];
    const rings = [];
    ringSpecs.forEach(spec => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(spec.r,spec.t,10,120),spec.mat);
      ring.rotation.set(...spec.rot); assembly.add(ring); rings.push(ring);
    });
    const pinGeo = new THREE.CylinderGeometry(.035,.035,.38,12);
    for (let i=0;i<12;i++) {
      const a=i*Math.PI/6;
      const pin = new THREE.Mesh(pinGeo, i%3===0?accent:metal);
      pin.position.set(Math.cos(a)*1.55,Math.sin(a)*1.55,0);
      pin.rotation.z=a+Math.PI/2;
      assembly.add(pin);
      const bolt = new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),darkMetal);
      bolt.position.set(Math.cos(a)*1.83,Math.sin(a)*1.83,.03);
      assembly.add(bolt);
    }
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.12,1)),
      new THREE.LineBasicMaterial({color:0xc8f169,transparent:true,opacity:.35})
    );
    assembly.add(wire);
    const starPoints = [];
    for(let i=0;i<170;i++) starPoints.push((Math.random()-.5)*8,(Math.random()-.5)*8,(Math.random()-.5)*3-1.5);
    const points = new THREE.BufferGeometry(); points.setAttribute('position',new THREE.Float32BufferAttribute(starPoints,3));
    const dust = new THREE.Points(points,new THREE.PointsMaterial({color:0xc8f169,size:.018,transparent:true,opacity:.65}));
    scene.add(dust);

    const resize = () => {
      const w=host.clientWidth,h=host.clientHeight;
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
    let pointerX=0,pointerY=0,targetX=0,targetY=0;
    host.addEventListener('pointermove',e=>{
      const rect=host.getBoundingClientRect();
      targetY=((e.clientX-rect.left)/rect.width-.5)*.55;
      targetX=((e.clientY-rect.top)/rect.height-.5)*.35;
    },{passive:true});
    host.addEventListener('pointerleave',()=>{targetX=0;targetY=0;},{passive:true});
    let frame;
    const animate = () => {
      frame=requestAnimationFrame(animate);
      pointerX+=(targetX-pointerX)*.035; pointerY+=(targetY-pointerY)*.035;
      assembly.rotation.y += .0026;
      assembly.rotation.x = pointerX + Math.sin(performance.now()*.00035)*.08;
      assembly.rotation.y += pointerY*.012;
      rings[1].rotation.z -= .0014;
      rings[2].rotation.x += .001;
      core.rotation.y -= .003;
      inner.rotation.x += .004; inner.rotation.z += .002;
      dust.rotation.y -= .00015;
      renderer.render(scene,camera);
    };
    animate();
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else animate();});
  } catch (error) {
    // Graceful fallback: the CSS visual background and grid still carry the hero.
    canvas.style.display='none';
    console.info('3D visual unavailable; showing static fallback.', error);
  }
}
initHero3D();
