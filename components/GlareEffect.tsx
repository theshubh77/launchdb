import React from "react";
import "./GlareEffect.css";

interface GlareEffectProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  background?: string;
  borderRadius?: string;
  borderColor?: string;
  children?: React.ReactNode;
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

const GlareEffect = ({
  width = "500px",
  height = "500px",
  background = "#000",
  borderRadius = "10px",
  borderColor = "#333",
  children,
  glareColor = "#ffffff",
  glareOpacity = 0.5,
  glareAngle = -45,
  glareSize = 250,
  className = "",
  style = {},
  ...rest
}: GlareEffectProps) => {
  const hex = glareColor.replace("#", "");
  let rgba = glareColor;
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }

  const vars = {
    "--ge-width": width,
    "--ge-height": height,
    "--ge-bg": background,
    "--ge-br": borderRadius,
    "--ge-angle": `${glareAngle}deg`,
    "--ge-size": `${glareSize}%`,
    "--ge-rgba": rgba,
    "--ge-border": borderColor,
  } as React.CSSProperties;

  return (
    <div
      className={`glare-effect ${className}`}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default GlareEffect;
