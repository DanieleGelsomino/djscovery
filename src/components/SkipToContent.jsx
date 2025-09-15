import React from "react";
import styled from "styled-components";

const A = styled.a`
  position: absolute;
  left: -999px;
  top: 0;
  background: #000;
  color: #fff;
  padding: 10px 14px;
  border: 2px solid var(--yellow);
  border-radius: 10px;
  z-index: 10000;
  &:focus {
    left: 10px;
  }
`;

export default function SkipToContent() {
  return (
    <A href="#main-content">Salta al contenuto principale</A>
  );
}

