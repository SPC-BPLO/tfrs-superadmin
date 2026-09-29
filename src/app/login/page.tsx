"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

const slides=["/san-pablo-city-hall.png","/sampaloc-lake-clean.png","/san-pablo-cathedral.png"];

export default function Login(){
  const router=useRouter();
  const[active,setActive]=useState(0),[show,setShow]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[slide,setSlide]=useState(0),[verified,setVerified]=useState(false),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  useEffect(()=>{const timer=window.setInterval(()=>setActive(value=>(value+1)%slides.length),5000);return()=>window.clearInterval(timer)},[]);
  function verify(value:number){setSlide(value);if(value>=98){setSlide(100);setVerified(true);setError("")}}
  async function submit(event:FormEvent){event.preventDefault();if(!verified){setError("Slide to verify before continuing.");return}setLoading(true);setError("");const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const data=await response.json().catch(()=>({}));if(!response.ok){setError(data.error||"Unable to sign in.");setLoading(false);setSlide(0);setVerified(false);return}router.push("/dashboard");router.refresh()}
  return <main className="admin-auth">
    <aside className="admin-auth-visual" aria-label="San Pablo City landmarks">
      <div className="admin-auth-brand"><img src="/san-pablo-city-seal.png" alt="Official seal of the City of San Pablo"/><span><strong>City Government of San Pablo</strong><small>TFRS Super Administration</small></span></div>
      {slides.map((src,index)=><figure key={src} className={index===active?"active":""}><img src={src} alt="San Pablo City landmark"/></figure>)}
    </aside>
    <section className="admin-auth-panel">
      <form onSubmit={submit} className="admin-auth-form">
        <div className="admin-auth-heading"><span>SECURE ADMINISTRATOR PORTAL</span><h1>Log in to<br/>Super Admin</h1><p>Enter your authorized administrator credentials to continue.</p></div>
        <label>Email address<input type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="admin@cityhall.gov.ph" required autoComplete="username"/></label>
        <label>Password<div className="admin-password"><input type={show?"text":"password"} value={password} onChange={event=>setPassword(event.target.value)} placeholder="Enter your password" minLength={8} required autoComplete="current-password"/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"}>{show?<EyeOff/>:<Eye/>}</button></div></label>
        <button className="admin-forgot" type="button" onClick={()=>setError("Use the configured administrator recovery process to reset this account.")}>Forgot password?</button>
        {email.trim()&&password?<div className={`admin-security-slider ${verified?"verified":""}`} style={{"--progress":`${slide}%`} as React.CSSProperties}><span>{verified?"Identity gesture verified":"Slide to verify"}</span><input type="range" min="0" max="100" value={slide} onChange={event=>verify(Number(event.target.value))} aria-label="Slide to verify" disabled={verified||loading}/></div>:null}
        {error&&<p className="admin-form-error" role="alert">{error}</p>}
        <button className="admin-login-button" disabled={loading}>{loading?"Signing in…":"Continue"}</button>
        <p className="admin-auth-help">Authorized Super Administrator access only.</p>
      </form>
    </section>
  </main>
}
