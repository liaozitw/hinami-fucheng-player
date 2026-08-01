import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import * as THREE from 'three';
import { ArrowLeft, Frown, Maximize, Meh, Pause, Play, Rotate3D, RotateCcw, Smile, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react';
import type { Video } from './types';
import { useI18n } from './i18n';

type Props = { video: Video; onClose: () => void };

export default function Player({ video, onClose }: Props) {
  const {t}=useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const vrRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vr, setVr] = useState(video.vr);
  const [rating,setRating]=useState(video.rating);
  const [zoom,setZoom]=useState(1);
  const vrCameraRef=useRef<THREE.PerspectiveCamera|null>(null);
  const [uiVisible, setUiVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const src = video.native ? `/api/video/${video.id}` : `/api/hls/${video.id}/master.m3u8`;

  useEffect(() => {
    const el = videoRef.current!;
    let hls: Hls | undefined;
    if (!video.native && Hls.isSupported()) { hls = new Hls(); hls.loadSource(src); hls.attachMedia(el); }
    else el.src = src;
    el.play().catch(() => undefined);
    return () => hls?.destroy();
  }, [src, video.native]);
  useEffect(() => {
    const save=()=>{const el=videoRef.current;if(!el)return;fetch(`/api/history/${video.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({progress:el.currentTime||0,duration:Number.isFinite(el.duration)?el.duration:0}),keepalive:true}).catch(()=>undefined);};
    save();
    const timer=setInterval(save,10000);
    window.addEventListener('pagehide',save);
    return()=>{clearInterval(timer);window.removeEventListener('pagehide',save);save();};
  },[video.id]);

  useEffect(() => {
    if (!vr || !vrRef.current || !videoRef.current) return;
    const host = vrRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(host.clientWidth, host.clientHeight); host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, host.clientWidth / host.clientHeight, .1, 1100);
    vrCameraRef.current=camera;
    const texture = new THREE.VideoTexture(videoRef.current);
    const geometry = new THREE.SphereGeometry(500, 60, 40); geometry.scale(-1, 1, 1);
    scene.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture })));
    let lon = 0, lat = 0, down = false, x = 0, y = 0, startLon = 0, startLat = 0, frame = 0;
    const onDown = (e: PointerEvent) => { down = true; x = e.clientX; y = e.clientY; startLon = lon; startLat = lat; };
    const onMove = (e: PointerEvent) => { if (down) { lon = (x - e.clientX) * .12 + startLon; lat = (e.clientY - y) * .12 + startLat; } };
    const onUp = () => { down = false; };
    renderer.domElement.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    const draw = () => { lat = Math.max(-85, Math.min(85, lat)); const phi = THREE.MathUtils.degToRad(90 - lat); const theta = THREE.MathUtils.degToRad(lon); camera.lookAt(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta)); renderer.render(scene, camera); frame = requestAnimationFrame(draw); }; draw();
    const resize = () => { camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); }; window.addEventListener('resize', resize);
    return () => { vrCameraRef.current=null; cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); renderer.dispose(); texture.dispose(); geometry.dispose(); renderer.domElement.remove(); };
  }, [vr]);
  useEffect(()=>{if(vrCameraRef.current){vrCameraRef.current.fov=Math.max(30,Math.min(100,75/zoom));vrCameraRef.current.updateProjectionMatrix();}},[zoom,vr]);

  const revealUi = () => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), 2500);
  };
  useEffect(() => {
    revealUi();
    const onKey = () => revealUi();
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const toggle = () => { const el = videoRef.current!; el.paused ? el.play() : el.pause(); };
  const rate=async(value:'good'|'medium'|'bad')=>{const next=rating===value?null:value;const res=await fetch(`/api/videos/${video.id}/rating`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({rating:next})});if(res.ok)setRating(next);};
  const changeZoom=(delta:number)=>setZoom(value=>Math.max(.6,Math.min(2.5,Math.round((value+delta)*10)/10)));
  const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return <div className={`player-page ${uiVisible ? 'ui-visible' : 'ui-hidden'}`} onPointerMove={revealUi} onPointerDown={revealUi} onTouchStart={revealUi} onWheel={e=>{e.preventDefault();revealUi();changeZoom(e.deltaY<0?.1:-.1);}}>
    <video ref={videoRef} className={vr ? 'source-video hidden' : 'source-video'} style={!vr?{transform:`scale(${zoom})`}:undefined} playsInline onPlay={() => setPlaying(true)} onPause={e => {setPlaying(false);fetch(`/api/history/${video.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({progress:e.currentTarget.currentTime,duration:e.currentTarget.duration||0}),keepalive:true}).catch(()=>undefined);}} onTimeUpdate={e => setProgress(e.currentTarget.currentTime)} onDurationChange={e => setDuration(e.currentTarget.duration || 0)} />
    {vr && <div className="vr-stage" ref={vrRef}><span className="drag-tip player-overlay">{t('dragVr')}</span></div>}
    <button className="player-back player-overlay" onClick={onClose}><ArrowLeft/> {t('backLibrary')}</button>
    <div className="player-title player-overlay"><span>{video.name}</span><small>{video.extension.toUpperCase()} {vr ? ` · ${t('immersive')}` : ''}</small></div>
    <div className="controls player-overlay" onPointerEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); setUiVisible(true); }} onPointerLeave={revealUi}>
      <input aria-label="播放進度" type="range" min="0" max={duration || 1} value={progress} onChange={e => { videoRef.current!.currentTime = Number(e.target.value); }} />
      <div className="control-row"><button onClick={toggle}>{playing ? <Pause/> : <Play/>}</button><button onClick={() => { videoRef.current!.muted = !muted; setMuted(!muted); }}>{muted ? <VolumeX/> : <Volume2/>}</button><span>{time(progress)} / {time(duration)}</span><span className="spacer"/><div className="zoom-controls"><button onClick={()=>changeZoom(-.1)} title={t('zoomOut')}><ZoomOut/></button><button className="zoom-value" onClick={()=>setZoom(1)} title={t('resetZoom')}>{Math.round(zoom*100)}%</button><button onClick={()=>changeZoom(.1)} title={t('zoomIn')}><ZoomIn/></button><button onClick={()=>setZoom(1)} title={t('resetZoom')}><RotateCcw/></button></div><div className="rating-controls"><span>{t('myRating')}</span><button className={rating==='good'?'active good':''} onClick={()=>rate('good')} title={t('good')}><Smile/></button><button className={rating==='medium'?'active medium':''} onClick={()=>rate('medium')} title={t('medium')}><Meh/></button><button className={rating==='bad'?'active bad':''} onClick={()=>rate('bad')} title={t('bad')}><Frown/></button></div><button className={vr ? 'active' : ''} onClick={() => setVr(!vr)} title={t('toggleVr')}><Rotate3D/></button><button onClick={() => document.documentElement.requestFullscreen()}><Maximize/></button></div>
    </div>
  </div>;
}
