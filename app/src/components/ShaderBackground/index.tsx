import { Aurora, FilmGrain, Shader, Swirl } from "shaders/react";

export function ShaderBackground() {
  return (
    <div className="shader-background" aria-hidden="true">
      <Shader className="shader-background__canvas" disableTelemetry>
        <Swirl colorA="#0b1329" colorB="#0c0f17" detail={1.6} />
        <Aurora
          balance={73}
          blendMode="linearDodge"
          center={{ x: 0, y: 0.28 }}
          colorA="#bd93f9"
          colorB="#ff79c6"
          colorC="#8be9fd"
          colorSpace="oklab"
          curtainCount={1}
          intensity={92}
          rayDensity={7}
          seed={14}
          speed={5.6}
          waviness={193}
        />
        <FilmGrain strength={0.04} />
      </Shader>
      <div className="shader-background__veil" />
    </div>
  );
}

export default ShaderBackground;
