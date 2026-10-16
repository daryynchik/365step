"use client";
import {useEffect,useState} from 'react';
export function Celebration(){const[show,setShow]=useState(true);useEffect(()=>{const timer=setTimeout(()=>setShow(false),2700);return()=>clearTimeout(timer)},[]);if(!show)return null;return <div className="success-particles" aria-hidden="true">{Array.from({length:35},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,animationDelay:`${(i%7)*.08}s`,transform:`rotate(${i*13}deg)`}}/>)}</div>}
