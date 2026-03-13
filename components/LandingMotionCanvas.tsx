'use client'

import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `
attribute vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

float orb(vec2 uv, vec2 center, float radius) {
  float distanceToCenter = distance(uv, center);
  return 1.0 - smoothstep(radius * 0.35, radius, distanceToCenter);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float time = u_time * 0.18;

  vec3 base = vec3(0.985, 0.979, 0.968);
  vec3 teal = vec3(0.733, 0.874, 0.837);
  vec3 blue = vec3(0.777, 0.842, 0.955);
  vec3 sand = vec3(0.954, 0.885, 0.792);

  vec2 centerA = vec2(0.28 + sin(time) * 0.09, 0.38 + cos(time * 1.2) * 0.08);
  vec2 centerB = vec2(0.74 + cos(time * 0.9) * 0.11, 0.62 + sin(time * 1.05) * 0.08);
  vec2 centerC = vec2(0.54 + sin(time * 0.7) * 0.08, 0.24 + cos(time * 0.85) * 0.06);

  float glowA = orb(uv, centerA, 0.48);
  float glowB = orb(uv, centerB, 0.42);
  float glowC = orb(uv, centerC, 0.36);

  vec3 color = base;
  color = mix(color, teal, glowA * 0.52);
  color = mix(color, blue, glowB * 0.46);
  color = mix(color, sand, glowC * 0.34);

  float sweep = 0.5 + 0.5 * sin((uv.x + uv.y + time) * 18.0);
  color += 0.02 * sweep;

  gl_FragColor = vec4(color, 1.0);
}
`

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)

  if (!shader) {
    return null
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

export function LandingMotionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true })

    if (!gl) {
      return
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

    if (!vertexShader || !fragmentShader) {
      return
    }

    const program = gl.createProgram()

    if (!program) {
      return
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return
    }

    const buffer = gl.createBuffer()

    if (!buffer) {
      return
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )

    const positionLocation = gl.getAttribLocation(program, 'position')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    let animationFrame = 0

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvas.clientWidth
      const height = canvas.clientHeight

      canvas.width = Math.floor(width * ratio)
      canvas.height = Math.floor(height * ratio)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const draw = (timestamp: number) => {
      resize()
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform1f(timeLocation, timestamp * 0.001)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      if (!mediaQuery.matches) {
        animationFrame = window.requestAnimationFrame(draw)
      }
    }

    draw(0)

    if (!mediaQuery.matches) {
      animationFrame = window.requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      window.cancelAnimationFrame(animationFrame)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
}
