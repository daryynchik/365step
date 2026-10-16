"use client";
import {useEffect,useRef,useState} from 'react';
/** Locally built WebGL character. No remote models, textures or tracking. */
export function PlayerAvatar({weapon='starter',shield='starter',opponent=false,animate=false}:{weapon?:string;shield?:string;opponent?:boolean;animate?:boolean}){
 const host=useRef<HTMLDivElement>(null);const [unavailable,setUnavailable]=useState(false);
 useEffect(()=>{let dispose=()=>{};let cancelled=false;
 import('three').then(THREE=>{if(cancelled||!host.current)return;const el=host.current;let renderer:InstanceType<typeof THREE.WebGLRenderer>;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setUnavailable(true);return;}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(renderer.domElement);
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(3.8,2.8,6.8);camera.lookAt(0,1.35,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x9aa887,2.8));const light=new THREE.DirectionalLight(0xfff6e3,3);light.position.set(4,7,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);
 const player=new THREE.Group();scene.add(player);
 const palette={cloth:opponent?0xb3956f:0x89a56f,skin:0xe9c69b,boots:0x665e46,metal:0xb8c8c4};
 const mat=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.82});
 function mesh(geometry:ConstructorParameters<typeof THREE.Mesh>[0],color:number,x:number,y:number,z:number,parent=player){const m=new THREE.Mesh(geometry,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 mesh(new THREE.CapsuleGeometry(.31,.48,4,8),palette.cloth,0,1.18,0);
 mesh(new THREE.SphereGeometry(.36,16,12),palette.skin,0,1.96,.025);
 mesh(new THREE.SphereGeometry(.37,12,8,0,Math.PI*2,0,Math.PI/2),0x655d43,0,2.02,.02);
 const hat=mesh(new THREE.CylinderGeometry(.27,.4,.22,12),palette.cloth,0,2.22,.02);hat.rotation.z=-.06;
 mesh(new THREE.CylinderGeometry(.43,.43,.045,16),palette.cloth,0,2.12,.02);
 for(const x of [-.12,.12])mesh(new THREE.SphereGeometry(.026,8,8),0x3a4233,x,1.99,.35);
 mesh(new THREE.SphereGeometry(.045,8,8),0xdcb48c,0,1.91,.37);
 for(const x of [-.19,.19]){mesh(new THREE.CapsuleGeometry(.14,.33,4,8),0x677b52,x,.57,0);mesh(new THREE.BoxGeometry(.29,.2,.42),palette.boots,x,.2,.06);}
 const left=mesh(new THREE.CapsuleGeometry(.12,.42,4,8),palette.cloth,-.43,1.19,0);left.rotation.z=-.18;
 const right=mesh(new THREE.CapsuleGeometry(.12,.42,4,8),palette.cloth,.43,1.19,0);right.rotation.z=.18;
 mesh(new THREE.SphereGeometry(.12,10,8),palette.skin,-.48,.9,.01);mesh(new THREE.SphereGeometry(.12,10,8),palette.skin,.48,.9,.01);
 mesh(new THREE.BoxGeometry(.43,.53,.2),0xb5a075,0,1.25,-.3);mesh(new THREE.BoxGeometry(.45,.08,.24),0x8a7957,0,1.42,-.3);
 mesh(new THREE.BoxGeometry(.63,.09,.44),0x8d7850,0,1.03,0);mesh(new THREE.BoxGeometry(.1,.1,.03),0xd8c18b,0,1.03,.24);
 const sword=new THREE.Group();sword.position.set(.5,.92,.05);sword.rotation.z=-.2;player.add(sword);
 const bladeColor=weapon==='steel-blade'?palette.metal:0xb8a074;
 mesh(new THREE.BoxGeometry(.065,.22,.065),0x6b6346,0,0,0,sword);mesh(new THREE.BoxGeometry(.28,.07,.08),0x8d9975,0,.14,0,sword);mesh(new THREE.BoxGeometry(.12,.66,.045),bladeColor,0,.49,0,sword);mesh(new THREE.ConeGeometry(.085,.15,4),bladeColor,0,.89,0,sword);
 const shieldGroup=new THREE.Group();shieldGroup.position.set(-.51,1.05,.15);shieldGroup.rotation.set(Math.PI/2,0,-.2);player.add(shieldGroup);
 mesh(new THREE.CylinderGeometry(.29,.29,.07,8),shield==='steel-shield'?0xa0b2b0:shield==='oak-shield'?0xb9a071:0x829a69,0,0,0,shieldGroup);mesh(new THREE.SphereGeometry(.075,8,8),0xe1d6b2,0,.055,0,shieldGroup);
 const base=mesh(new THREE.CylinderGeometry(1.03,1.08,.13,48),0xe3ead8,0,.015,0,scene as unknown as typeof player);base.receiveShadow=true;
 const shadow=mesh(new THREE.CircleGeometry(4,48),0xf0f4e8,0,-.06,0,scene as unknown as typeof player);shadow.rotation.x=-Math.PI/2;
 let rotation=opponent?-.3:.15;let dragging=false;let lastX=0;
 const down=(e:PointerEvent)=>{dragging=true;lastX=e.clientX;el.setPointerCapture(e.pointerId)};const move=(e:PointerEvent)=>{if(dragging){rotation+=(e.clientX-lastX)*.015;lastX=e.clientX;}};const up=()=>{dragging=false};
 el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);
 const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(el);resize();
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let frame=0;const started=performance.now();const draw=()=>{if(cancelled)return;const t=(performance.now()-started)/1000;player.rotation.y=rotation+(reduced?0:Math.sin(t*.7)*.09);player.position.y=reduced?0:Math.sin(t*2)*.025;if(animate&&!reduced)sword.rotation.z=-.2+Math.sin(t*5)*.35;renderer.render(scene,camera);frame=requestAnimationFrame(draw)};draw();
 dispose=()=>{cancelAnimationFrame(frame);observer.disconnect();el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});renderer.dispose();renderer.domElement.remove()};
 }).catch(()=>setUnavailable(true));return()=>{cancelled=true;dispose()};
 },[weapon,shield,opponent,animate]);
 return <div className="avatar-stage" ref={host} role="img" aria-label={`Трёхмерный персонаж. Оружие: ${weapon}, щит: ${shield}. Можно вращать перетаскиванием.`}>{unavailable&&<div className="avatar-loading">Персонаж · меч и щит экипированы<br/>Для 3D включите WebGL в браузере</div>}</div>
}
