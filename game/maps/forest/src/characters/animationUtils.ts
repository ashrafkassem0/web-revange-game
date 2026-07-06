import * as THREE from 'three';

/** عظام Mixamo/GLTF التي تحمل حركة أمامية داخل الأنيمiشن */
const ROOT_MOTION_BONE = /hips|pelvis/i;

function isRootMotionPositionTrack(name: string): boolean {
  if (!name.endsWith('.position')) return false;
  const bonePath = name.slice(0, -'.position'.length);
  return ROOT_MOTION_BONE.test(bonePath);
}

/** إزالة حركة أمامية/خلفية من الأنيمiشن — الحركة الفعلية من كود اللعبة فقط */
export function stripRootMotion(clip: THREE.AnimationClip): THREE.AnimationClip {
  const tracks = clip.tracks.filter((track) => !isRootMotionPositionTrack(track.name));
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

export function sanitizeCharacterClips(clips: THREE.AnimationClip[]): THREE.AnimationClip[] {
  return clips.map((clip) => {
    const n = clip.name.toLowerCase();
    if (
      n.includes('walk') ||
      n.includes('run') ||
      n.includes('idle') ||
      n.includes('jump') ||
      n.includes('catwalk')
    ) {
      return stripRootMotion(clip);
    }
    return clip;
  });
}
