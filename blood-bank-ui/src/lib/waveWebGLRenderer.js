const VERT_SRC = `
attribute vec2 a_position;
attribute float a_v;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform float u_alpha;
uniform float u_alphaScale;

varying float v_grad;

void main() {
  vec2 zeroToOne = a_position / u_resolution;
  vec2 clip = zeroToOne * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_grad = sin(a_v * 3.14159265);
  gl_PointSize = 1.0;
}
`;

const FRAG_SRC = `
precision mediump float;
varying float v_grad;
uniform vec3 u_color;
uniform float u_alpha;
uniform float u_alphaScale;

void main() {
  float alpha = v_grad * u_alpha * u_alphaScale;
  gl_FragColor = vec4(u_color / 255.0, alpha);
}
`;

const LINE_VERT = `
attribute vec2 a_position;
uniform vec2 u_resolution;

void main() {
  vec2 zeroToOne = a_position / u_resolution;
  vec2 clip = zeroToOne * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const LINE_FRAG = `
precision mediump float;
uniform vec3 u_color;
uniform float u_alpha;

void main() {
  gl_FragColor = vec4(u_color / 255.0, u_alpha);
}
`;

const PARTICLE_VERT = `
attribute vec2 a_center;
attribute float a_size;
attribute float a_alpha;
uniform vec2 u_resolution;
uniform vec3 u_color;

varying float v_alpha;

void main() {
  vec2 zeroToOne = a_center / u_resolution;
  vec2 clip = zeroToOne * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = max(1.0, a_size * 2.0);
  v_alpha = a_alpha;
}
`;

const PARTICLE_FRAG = `
precision mediump float;
varying float v_alpha;
uniform vec3 u_color;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  float soft = 1.0 - smoothstep(0.2, 0.5, dist);
  gl_FragColor = vec4(u_color / 255.0, v_alpha * soft);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function createProgram(gl, vertSrc, fragSrc) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

export function createWaveWebGLRenderer(canvas) {
  const gl =
    canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    }) ||
    canvas.getContext('experimental-webgl', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

  if (!gl) {
    throw new Error('WebGL is not available');
  }

  const ribbonProgram = createProgram(gl, VERT_SRC, FRAG_SRC);
  const lineProgram = createProgram(gl, LINE_VERT, LINE_FRAG);
  const particleProgram = createProgram(gl, PARTICLE_VERT, PARTICLE_FRAG);

  const ribbonPosLoc = gl.getAttribLocation(ribbonProgram, 'a_position');
  const ribbonVLoc = gl.getAttribLocation(ribbonProgram, 'a_v');
  const linePosLoc = gl.getAttribLocation(lineProgram, 'a_position');
  const particleCenterLoc = gl.getAttribLocation(particleProgram, 'a_center');
  const particleSizeLoc = gl.getAttribLocation(particleProgram, 'a_size');
  const particleAlphaLoc = gl.getAttribLocation(particleProgram, 'a_alpha');

  const ribbonBuffer = gl.createBuffer();
  const lineBuffer = gl.createBuffer();
  const particleBuffer = gl.createBuffer();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.disable(gl.DEPTH_TEST);

  let resolution = [1, 1];

  function setResolution(w, h) {
    resolution = [w, h];
    gl.viewport(0, 0, w, h);
  }

  function drawRibbonMesh(vertices, color, alpha, alphaScale) {
    gl.useProgram(ribbonProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, ribbonBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(ribbonPosLoc);
    gl.vertexAttribPointer(ribbonPosLoc, 2, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(ribbonVLoc);
    gl.vertexAttribPointer(ribbonVLoc, 1, gl.FLOAT, false, 12, 8);

    gl.uniform2fv(gl.getUniformLocation(ribbonProgram, 'u_resolution'), resolution);
    gl.uniform3fv(gl.getUniformLocation(ribbonProgram, 'u_color'), color);
    gl.uniform1f(gl.getUniformLocation(ribbonProgram, 'u_alpha'), alpha);
    gl.uniform1f(gl.getUniformLocation(ribbonProgram, 'u_alphaScale'), alphaScale);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
  }

  function drawCrestLine(crest, color, alpha) {
    if (!crest || crest.length < 4) return;

    gl.useProgram(lineProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, crest, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(linePosLoc);
    gl.vertexAttribPointer(linePosLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2fv(gl.getUniformLocation(lineProgram, 'u_resolution'), resolution);
    gl.uniform3fv(gl.getUniformLocation(lineProgram, 'u_color'), color);
    gl.uniform1f(gl.getUniformLocation(lineProgram, 'u_alpha'), alpha);

    gl.drawArrays(gl.LINE_STRIP, 0, crest.length / 2);
  }

  function drawParticles(particles, color) {
    if (!particles || particles.length === 0) return;

    gl.useProgram(particleProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW);

    const stride = 16;
    gl.enableVertexAttribArray(particleCenterLoc);
    gl.vertexAttribPointer(particleCenterLoc, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(particleSizeLoc);
    gl.vertexAttribPointer(particleSizeLoc, 1, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(particleAlphaLoc);
    gl.vertexAttribPointer(particleAlphaLoc, 1, gl.FLOAT, false, stride, 12);

    gl.uniform2fv(gl.getUniformLocation(particleProgram, 'u_resolution'), resolution);
    gl.uniform3fv(gl.getUniformLocation(particleProgram, 'u_color'), color);

    gl.drawArrays(gl.POINTS, 0, particles.length / 4);
  }

  function render(frame) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const color = frame.color;
    const heatBoost = frame.heat * 0.06;

    frame.ribbons.forEach((ribbon) => {
      drawRibbonMesh(
        ribbon.vertices,
        color,
        ribbon.alpha + heatBoost,
        frame.alphaScale
      );
      drawCrestLine(ribbon.crest, color, frame.crestAlpha);
    });

    drawParticles(frame.particles, color);
  }

  function dispose() {
    gl.deleteBuffer(ribbonBuffer);
    gl.deleteBuffer(lineBuffer);
    gl.deleteBuffer(particleBuffer);
    gl.deleteProgram(ribbonProgram);
    gl.deleteProgram(lineProgram);
    gl.deleteProgram(particleProgram);
  }

  return { setResolution, render, dispose, gl };
}
