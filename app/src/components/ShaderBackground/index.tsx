import { Aurora, FilmGrain, Shader } from "shaders/react";

export function ShaderBackground() {
  return (
    <div className="shader-background" aria-hidden="true">
      <Shader className="shader-background__canvas" disableTelemetry>
        <Aurora
          center={{ x: 0.5, y: 0.12 }}
          colorA="#bd93f9"
          colorB="#ff79c6"
          colorC="#8be9fd"
          colorSpace="oklab"
          curtainCount={1}
          intensity={55}
          rayDensity={4}
          seed={7}
          speed={0.6}
          waviness={18}
        />
        <FilmGrain strength={0.02} />
      </Shader>
      <div className="shader-background__veil" />
    </div>
  );
}


export default ShaderBackground;
